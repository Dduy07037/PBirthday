'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Kiểm tra môi trường thực thi
const isClient = typeof window !== 'undefined';

export default function GltfDebugger() {
  const [modelInfo, setModelInfo] = useState('Loading...');
  const [testCanvasRendering, setTestCanvasRendering] = useState(false);
  
  // Kiểm tra khả năng truy cập vào các tập tin mô hình
  useEffect(() => {
    if (!isClient) return;
    
    const checkModelFiles = async () => {
      const results = [];
      
      // Danh sách các đường dẫn cần kiểm tra
      const paths = [
        '/cardboard_house/scene.gltf',
        '/cardboard_house/scene.bin',
        '/cardboard_house/textures/Material_50_baseColor.png'
      ];
      
      for (const path of paths) {
        try {
          const response = await fetch(path, { method: 'HEAD' });
          const status = response.status;
          const contentType = response.headers.get('content-type');
          const size = response.headers.get('content-length');
          
          if (status === 200) {
            results.push(`✓ ${path}: ${status} OK, Type: ${contentType}, Size: ${formatSize(size)}`);
            
            // Nếu là file .gltf, thử đọc nội dung
            if (path.endsWith('.gltf')) {
              try {
                const dataResponse = await fetch(path);
                const data = await dataResponse.json();
                
                // Hiển thị thông tin cơ bản về mô hình
                const buffers = data.buffers || [];
                const meshes = data.meshes || [];
                const materials = data.materials || [];
                const textures = data.textures || [];
                
                results.push(`  - Buffers: ${buffers.length}`);
                results.push(`  - Meshes: ${meshes.length}`);
                results.push(`  - Materials: ${materials.length}`);
                results.push(`  - Textures: ${textures.length}`);
                
                // Kiểm tra đường dẫn buffer
                for (const buffer of buffers) {
                  if (buffer.uri) {
                    results.push(`  - Buffer URI: ${buffer.uri}`);
                    // Kiểm tra xem buffer có thể truy cập được không
                    try {
                      const bufferPath = buffer.uri.startsWith('http') 
                        ? buffer.uri 
                        : path.substring(0, path.lastIndexOf('/') + 1) + buffer.uri;
                        
                      const bufferResponse = await fetch(bufferPath, { method: 'HEAD' });
                      results.push(`    ${bufferResponse.status === 200 ? '✓' : '✗'} ${bufferPath}: ${bufferResponse.status}`);
                    } catch (error) {
                      results.push(`    ✗ Error checking buffer: ${error.message}`);
                    }
                  }
                }
              } catch (error) {
                results.push(`  ✗ Error reading GLTF content: ${error.message}`);
              }
            }
          } else {
            results.push(`✗ ${path}: ${status} ERROR, Type: ${contentType}`);
          }
        } catch (error) {
          results.push(`✗ ${path}: Error - ${error.message}`);
        }
      }
      
      setModelInfo(results.join('\n'));
    };
    
    const formatSize = (bytes) => {
      if (!bytes) return 'unknown';
      bytes = parseInt(bytes);
      if (bytes < 1024) return bytes + ' bytes';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };
    
    checkModelFiles();
  }, []);
  
  // Kiểm tra WebGL và Three.js
  useEffect(() => {
    if (!isClient) return;
    
    try {
      // Kiểm tra khả năng hỗ trợ WebGL
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) {
        setModelInfo(prev => prev + '\n\n❌ WebGL không được hỗ trợ trên trình duyệt này!');
        return;
      }
      
      // Thông tin về WebGL
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown';
      const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';
      
      const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      const maxViewportDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
      const maxCubeMapSize = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);
      
      const webglInfo = [
        `✓ WebGL được hỗ trợ`,
        `- Vendor: ${vendor}`,
        `- Renderer: ${renderer}`,
        `- Max Texture Size: ${maxTextureSize}x${maxTextureSize}`,
        `- Max Viewport Dims: ${maxViewportDims[0]}x${maxViewportDims[1]}`,
        `- Max CubeMap Size: ${maxCubeMapSize}x${maxCubeMapSize}`
      ].join('\n');
      
      setModelInfo(prev => prev + '\n\n' + webglInfo);
    } catch (error) {
      setModelInfo(prev => prev + '\n\n❌ Lỗi kiểm tra WebGL: ' + error.message);
    }
  }, []);
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: '#f5f5f5',
      padding: '20px',
      fontFamily: 'monospace',
      zIndex: 1000,
      overflowY: 'auto'
    }}>
      <h1>GLTF Debug Info</h1>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reload Page
        </button>
        
        <button 
          onClick={() => window.location.href = '/'}
          style={{
            padding: '10px 20px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Back to Main Page
        </button>
      </div>
      
      <pre style={{
        background: '#f0f0f0',
        padding: '15px',
        borderRadius: '5px',
        border: '1px solid #ddd',
        whiteSpace: 'pre-wrap'
      }}>
        {modelInfo}
      </pre>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Browser Information</h2>
        <pre style={{
          background: '#f0f0f0',
          padding: '15px',
          borderRadius: '5px',
          border: '1px solid #ddd',
          whiteSpace: 'pre-wrap'
        }}>
          {isClient ? `
User Agent: ${navigator.userAgent}
Platform: ${navigator.platform}
Cookies Enabled: ${navigator.cookieEnabled}
Language: ${navigator.language}
Window Size: ${window.innerWidth}x${window.innerHeight}
Device Pixel Ratio: ${window.devicePixelRatio}
` : 'Not available in SSR mode'}
        </pre>
      </div>
    </div>
  );
} 