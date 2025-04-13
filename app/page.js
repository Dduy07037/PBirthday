'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Cute color theme
const COLORS = {
  bgGradientStart: '#ffe8d6',  // Soft peach
  bgGradientEnd: '#ffdab9',    // Peachpuff
  buttonColor: '#a57c65',      // Warm brown
  textColor: '#a57c65',        // Warm brown
  accentColor: '#d2b48c',      // Tan
  shadowColor: '#deb887'       // Burlywood
};

// Loading placeholder
function LoadingPlaceholder() {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: `linear-gradient(45deg, ${COLORS.bgGradientStart} 0%, ${COLORS.bgGradientEnd} 100%)`,
      color: COLORS.textColor
    }}>
      <h1 style={{ 
        marginBottom: '20px',
        fontSize: '3.5rem',
        textShadow: `0 0 10px ${COLORS.shadowColor}, 0 0 20px ${COLORS.shadowColor}, 2px 2px 0px #ffffff`,
        fontFamily: 'cursive, sans-serif',
        fontWeight: 'bold',
        animation: 'bounce 1s infinite alternate'
      }}>Happy Birthday!</h1>
      <p style={{ 
        fontSize: '1.2rem',
        fontFamily: 'cursive, sans-serif',
        textShadow: '1px 1px 2px rgba(255,255,255,0.7)'
      }}>Đang tải nhà hộp sữa 3D...</p>
      <div style={{ marginTop: '20px' }}>
        <div style={{ 
          width: '50px', 
          height: '50px',
          borderRadius: '50%',
          border: `4px solid ${COLORS.accentColor}`,
          borderTopColor: COLORS.buttonColor,
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
      <style jsx>{`
        @keyframes bounce {
          from { transform: scale(1); }
          to { transform: scale(1.05); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Disable SSR for the 3D component to avoid window is not defined errors
const GltfModelViewer = dynamic(() => import('./gltf-model'), {
  ssr: false,
  loading: () => <LoadingPlaceholder />
});

export default function Home() {
  const [error, setError] = useState(null);
  const [debug, setDebug] = useState([]);

  // Handle errors from 3D rendering
  const handleError = (err) => {
    console.error('Model error:', err);
    setError(err.message || 'Error loading model');
    
    // Add to debug logs
    setDebug(prev => [...prev, `Error: ${err.message || 'Unknown error'}`]);
  };

  // Handle successful loading
  const handleLoad = (gltf) => {
    console.log('Model loaded successfully:', gltf);
    setDebug(prev => [...prev, 'Cardboard house model loaded successfully!']);
  };

  // Show detailed debugging information on keyboard shortcut
  const [showDebug, setShowDebug] = useState(false);
  
  // Enable debugging with keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'd' && e.ctrlKey) {
        setShowDebug(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Verify model file paths are accessible
  useEffect(() => {
    const paths = [
      '/cardboard_house/scene.gltf',
      './cardboard_house/scene.gltf',
      '../public/cardboard_house/scene.gltf'
    ];
    
    // Helper function to check if file exists
    const checkFile = async (path) => {
      try {
        const response = await fetch(path);
        const status = response.status;
        setDebug(prev => [...prev, `Path "${path}" status: ${status}`]);
        console.log(`Path "${path}" status: ${status}`);
        
        // If successful, log some details about the response
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          const contentLength = response.headers.get('content-length');
          setDebug(prev => [...prev, 
            `Path "${path}" content-type: ${contentType}`,
            `Path "${path}" size: ${contentLength ? (parseInt(contentLength)/1024).toFixed(2) + ' KB' : 'unknown'}`
          ]);
        }
      } catch (err) {
        setDebug(prev => [...prev, `Path "${path}" fetch error: ${err.message}`]);
        console.error(`Path "${path}" fetch error:`, err);
      }
    };
    
    // Check each path
    paths.forEach(path => checkFile(path));
    
    // Also check if we can find the textures folder
    fetch('/cardboard_house/textures/Material_50_baseColor.png')
      .then(response => {
        setDebug(prev => [...prev, `Texture file status: ${response.status}`]);
      })
      .catch(err => {
        setDebug(prev => [...prev, `Texture file error: ${err.message}`]);
      });

  }, []);

  // Display error if there is one
  if (error) {
    return (
      <div style={{
        width: '100%', 
        height: '100vh', 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        background: `linear-gradient(45deg, ${COLORS.bgGradientStart} 0%, ${COLORS.bgGradientEnd} 100%)`,
        color: COLORS.textColor,
        padding: '20px'
      }}>
        <h1 style={{ 
          fontFamily: 'cursive, sans-serif',
          textShadow: `0 0 8px ${COLORS.shadowColor}, 1px 1px 0px #ffffff`
        }}>Error Loading 3D Model</h1>
        <p style={{ 
          marginTop: '20px', 
          fontFamily: 'cursive, sans-serif',
          textShadow: '1px 1px 2px rgba(255,255,255,0.7)'
        }}>{error}</p>
        
        {/* Debug information */}
        <div style={{ 
          marginTop: '20px', 
          maxHeight: '300px', 
          overflowY: 'auto', 
          width: '100%', 
          maxWidth: '600px',
          borderRadius: '15px',
          boxShadow: '0 4px 15px rgba(255,110,180,0.15)'
        }}>
          <h3 style={{ 
            fontFamily: 'cursive, sans-serif',
            textShadow: '1px 1px 2px rgba(255,255,255,0.7)',
            padding: '0 15px'
          }}>Debug Information:</h3>
          <pre style={{ 
            background: 'rgba(255,192,203,0.2)', 
            padding: '15px', 
            borderRadius: '10px',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            boxShadow: 'inset 0 0 10px rgba(255,110,180,0.1)'
          }}>
            {debug.map((log, i) => <div key={i}>{log}</div>)}
          </pre>
        </div>
        
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: '25px',
            padding: '12px 25px',
            background: COLORS.buttonColor,
            border: 'none',
            borderRadius: '25px', // More rounded corners
            color: 'white',
            cursor: 'pointer',
            fontFamily: 'cursive, sans-serif',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            boxShadow: '0 5px 15px rgba(255,110,180,0.3)',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 7px 20px rgba(255,110,180,0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 5px 15px rgba(255,110,180,0.3)';
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <GltfModelViewer 
        onError={handleError}
        onLoad={handleLoad}
      />
      
      {/* Debug overlay */}
      {showDebug && (
        <div style={{
          position: 'absolute',
          bottom: '15px',
          right: '15px',
          background: 'rgba(255,224,235,0.85)',
          padding: '15px',
          borderRadius: '15px',
          maxWidth: '400px',
          maxHeight: '300px',
          overflowY: 'auto',
          color: '#333',
          zIndex: 1000,
          fontSize: '12px',
          boxShadow: '0 5px 15px rgba(255,110,180,0.25)',
          fontFamily: 'monospace',
          border: `2px solid rgba(255,110,180,0.3)`
        }}>
          <h3 style={{ 
            color: COLORS.buttonColor, 
            margin: '0 0 10px 0', 
            fontFamily: 'cursive, sans-serif',
            fontWeight: 'bold',
            borderBottom: `2px dotted rgba(255,110,180,0.3)`,
            paddingBottom: '8px'
          }}>
            Debug Logs (Ctrl+D to toggle):
          </h3>
          <pre style={{ margin: 0 }}>
            {debug.map((log, i) => <div key={i}>{log}</div>)}
          </pre>
        </div>
      )}
      
      {/* Debug Button - hiển thị nút debug ở góc dưới bên trái */}
      <a 
        href="/debug" 
        target="_blank"
        style={{
          position: 'absolute',
          bottom: '15px',
          left: '15px',
          padding: '8px 15px',
          background: COLORS.buttonColor,
          color: 'white',
          borderRadius: '20px',
          fontSize: '14px',
          textDecoration: 'none',
          fontFamily: 'cursive, sans-serif',
          boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
          zIndex: 1000
        }}
      >
        Troubleshoot 3D
      </a>
    </div>
  );
} 