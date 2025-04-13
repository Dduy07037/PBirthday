'use client';

import React, { useState, useEffect, useRef, Suspense, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, Environment, Stage } from '@react-three/drei';
import * as THREE from 'three';

// Cute color theme - Màu sắc hoàng hôn để làm nổi bật ngôi nhà
const COLORS = {
  bgGradientStart: '#FF7E5F',  // Cam đỏ
  bgGradientEnd: '#120D31',    // Xanh tím đậm
  fogColor: '#734B5E',         // Tím nhạt
  canvasBackground: '#FF7E5F', // Cam đỏ
  groundColor: '#4A4969',      // Tím xám
  groundTextureColor: '#5A556A', // Tím đậm hơn
  particleColors: [            // Màu tuyết ấm áp
    '#ffffff', // Trắng
    '#FFF8E1', // Vàng nhạt
    '#FFF3CD', // Kem
    '#FFF0F5', // Hồng phấn
    '#FFFAFA', // Snow
    '#FFE4E1', // Misty rose
    '#FAF0E6'  // Linen
  ],
  sunColor: '#FF3F00', // Màu mặt trời hoàng hôn đỏ cam
  cloudColor: '#FFA07A' // Màu mây hồng cam khi hoàng hôn
};

// Simple Model component that displays a 3D model
function Model({ onLoad, onError, housePosition, houseScale, onHouseRefReady }) {
  // Setup camera
  const { camera, scene } = useThree();
  const houseModelRef = useRef();
  const catModelRef = useRef();
  
  // Gửi tham chiếu về component cha khi sẵn sàng
  useEffect(() => {
    if (houseModelRef.current && onHouseRefReady) {
      onHouseRefReady(houseModelRef.current);
      console.log("Đã gửi tham chiếu houseModelRef lên component cha");
    }
  }, [houseModelRef.current, onHouseRefReady]);
  
  // Set camera position only once
  useEffect(() => {
    // Thiết lập vị trí camera theo yêu cầu người dùng
    camera.position.set(155.1, 24.66, 13.16);
    camera.lookAt(104.09, 9.01, -71.42);
    console.log("Camera đã được thiết lập theo vị trí được chỉ định");
  }, [camera]);

  // Load cả hai mô hình
  const house = useGLTF('/cardboard_house/scene.gltf');
  const cat = useGLTF('/cat_model/scene.gltf');
  
  // Cập nhật vị trí Y và scale khi props thay đổi
  useEffect(() => {
    if (houseModelRef.current) {
      houseModelRef.current.position.y = housePosition;
      console.log(`Vị trí Y của ngôi nhà đã được cập nhật: ${housePosition}`);
    }
  }, [housePosition]);
  
  // Cập nhật scale khi houseScale thay đổi
  useEffect(() => {
    if (houseModelRef.current) {
      houseModelRef.current.scale.set(houseScale, houseScale, houseScale);
      console.log(`Scale của ngôi nhà đã được cập nhật: ${houseScale}`);
    }
  }, [houseScale]);
  
  useEffect(() => {
    // Xử lý khi tải mô hình thành công
    if (house && cat && onLoad) {
      onLoad({ house, cat });
      console.log("Đã tải thành công cả hai mô hình!");
    }
  }, [house, cat, onLoad]);
  
  // Setup mô hình house
  useEffect(() => {
    if (houseModelRef.current && house.scene) {
      console.log("Đang thiết lập mô hình HOUSE...");
      
      // Tìm kích thước thực của mô hình house
      const houseBox = new THREE.Box3().setFromObject(house.scene);
      const houseSize = houseBox.getSize(new THREE.Vector3());
      
      console.log("Kích thước thực của house:", houseSize);
      
      // Kiểm tra và điều chỉnh vật liệu - làm sáng vật liệu để nổi bật
      house.scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          if (child.material) {
            // Làm sáng vật liệu
            child.material.roughness = 0.25; // Giảm độ nhám để phản chiếu ánh sáng tốt hơn
            child.material.metalness = 0.05; // Giảm độ kim loại
            child.material.envMapIntensity = 2.5; // Tăng phản xạ ánh sáng môi trường
            
            // Tăng độ sáng của màu sắc
            if (child.material.color) {
              const color = child.material.color.clone();
              const hsl = {};
              color.getHSL(hsl);
              hsl.l = Math.min(hsl.l * 1.4, 1.0); // Tăng độ sáng nhiều hơn
              color.setHSL(hsl.h, hsl.s, hsl.l);
              child.material.color.copy(color);
            }
            
            child.material.transparent = false;
            child.material.needsUpdate = true;
          }
        }
      });
    }
  }, [house]); // Chỉ cập nhật khi house thay đổi, không phụ thuộc vào housePosition
  
  // Setup mô hình cat
  useEffect(() => {
    if (catModelRef.current && cat.scene) {
      console.log("Đang thiết lập mô hình CAT...");
      
      // Tìm kích thước thực của mô hình cat
      const catBox = new THREE.Box3().setFromObject(cat.scene);
      const catSize = catBox.getSize(new THREE.Vector3());
      const catCenter = catBox.getCenter(new THREE.Vector3());
      
      console.log("Kích thước thực của cat:", catSize);
      
      // Mèo sẽ có kích thước lớn hơn
      const catScale = 3.0 / Math.max(catSize.x, catSize.y, catSize.z);
      console.log("Hệ số scale cat:", catScale);
      
      // Đặt cat ở bên cạnh (cách bên trái) và sát mặt đất
      catModelRef.current.position.set(-50, -17, 0);
      catModelRef.current.rotation.set(0, Math.PI / 3, 0);
      catModelRef.current.scale.set(catScale, catScale, catScale);
      console.log("Đã đặt cat ở vị trí (-50, -17, 0)");
      
      // Kiểm tra và điều chỉnh vật liệu
      cat.scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          if (child.material) {
            // Tăng độ sáng cho vật liệu mèo
            child.material.roughness = 0.5;
            child.material.metalness = 0.0;
            
            // Tăng độ sáng để phù hợp với ánh sáng hoàng hôn
            if (child.material.color) {
              const color = child.material.color.clone();
              const hsl = {};
              color.getHSL(hsl);
              hsl.l = Math.min(hsl.l * 1.2, 1.0);
              color.setHSL(hsl.h, hsl.s, hsl.l);
              child.material.color.copy(color);
            }
          }
        }
      });
    }
  }, [cat]);

  // Tạo một nền đất đẹp hơn với kết cấu
  const groundTexture = useMemo(() => {
    // Tạo kết cấu sàn với nhiều nét
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    
    // Màu nền
    context.fillStyle = COLORS.groundColor;
    context.fillRect(0, 0, 512, 512);
    
    // Thêm một số chi tiết ngẫu nhiên
    const detailCount = 2000; // Thêm nhiều chi tiết hơn
    for (let i = 0; i < detailCount; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 3 + 0.5;
      
      // Tạo hiệu ứng gradient cho mặt đất
      const gradient = Math.random();
      let detailColor;
      if (gradient < 0.3) {
        detailColor = '#3D3B54'; // Màu tối hơn
      } else if (gradient < 0.7) {
        detailColor = COLORS.groundTextureColor;
      } else {
        detailColor = '#625F7B'; // Màu sáng hơn
      }
      
      context.fillStyle = detailColor;
      context.beginPath();
      context.arc(x, y, size, 0, Math.PI * 2);
      context.fill();
    }
    
    // Thêm một số đường kẻ nhẹ
    context.strokeStyle = '#5D5A70';
    context.lineWidth = 0.5;
    for (let i = 0; i < 30; i++) {
      const x1 = Math.random() * 512;
      const y1 = Math.random() * 512;
      const x2 = x1 + (Math.random() - 0.5) * 100;
      const y2 = y1 + (Math.random() - 0.5) * 100;
      
      context.beginPath();
      context.moveTo(x1, y1);
      context.lineTo(x2, y2);
      context.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 10);
    
    return texture;
  }, []);

  return (
    <>
      {/* Nền đất có kết cấu */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -20, 0]} receiveShadow>
        <planeGeometry args={[800, 800]} />
        <meshStandardMaterial 
          map={groundTexture} 
          roughness={0.9}
          metalness={0.1}
          color={COLORS.groundColor}
          envMapIntensity={0.5}
        />
      </mesh>
      
      {/* Mô hình House (ở giữa) */}
      {house.scene && (
        <primitive 
          ref={houseModelRef}
          object={house.scene}
          position={[0, housePosition, 0]}
          rotation={[0, Math.PI / 4, 0]}
          scale={[houseScale, houseScale, houseScale]}
        />
      )}
      
      {/* Mô hình Cat (bên trái) */}
      {cat.scene && (
        <primitive 
          ref={catModelRef}
          object={cat.scene}
          position={[-50, -17, 0]}
          rotation={[0, Math.PI / 3, 0]}
          scale={[3, 3, 3]}
        />
      )}
    </>
  );
}

// Component mặt trời
function Sun() {
  const sunRef = useRef();
  
  // Animation mặt trời
  useFrame(({ clock }) => {
    if (sunRef.current) {
      // Ánh sáng nhấp nháy nhẹ
      const pulseIntensity = 2.3 + Math.sin(clock.getElapsedTime() * 0.3) * 0.3;
      sunRef.current.material.emissiveIntensity = pulseIntensity;
    }
  });
  
  return (
    <mesh position={[100, 80, -150]} ref={sunRef}>
      <sphereGeometry args={[25, 32, 32]} />
      <meshStandardMaterial
        color={COLORS.sunColor}
        emissive={COLORS.sunColor}
        emissiveIntensity={2.3}
        toneMapped={false}
      />
    </mesh>
  );
}

// Component mây
function Cloud({ position, scale = 1, rotation = 0 }) {
  const cloudRef = useRef();
  
  // Animation mây di chuyển và bồng bềnh
  useFrame(({ clock }) => {
    if (cloudRef.current) {
      const time = clock.getElapsedTime();
      
      // Di chuyển mây chậm từ phải sang trái
      cloudRef.current.position.x -= 0.02; // Di chuyển chậm hơn nữa
      
      // Thêm chuyển động lên xuống nhẹ để tạo hiệu ứng bồng bềnh
      cloudRef.current.position.y += Math.sin(time * 0.2 + position[0] * 0.1) * 0.03;
      
      // Thêm hiệu ứng xoay nhẹ nhàng
      cloudRef.current.rotation.z = Math.sin(time * 0.1 + position[1] * 0.05) * 0.02;
      
      // Khi mây ra khỏi tầm nhìn, đặt lại bên phải
      if (cloudRef.current.position.x < -300) {
        cloudRef.current.position.x = 300;
      }
    }
  });
  
  return (
    <group 
      ref={cloudRef}
      position={position} 
      rotation={[0, rotation, 0]} 
      scale={[scale, scale, scale]}
    >
      {/* Tạo nhiều quả cầu chồng lên nhau để tạo hình dáng mây bồng bềnh hơn */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[10, 16, 16]} />
        <meshStandardMaterial color={COLORS.cloudColor} transparent opacity={0.9} />
      </mesh>
      <mesh position={[8, 0, 5]}>
        <sphereGeometry args={[8, 16, 16]} />
        <meshStandardMaterial color={COLORS.cloudColor} transparent opacity={0.9} />
      </mesh>
      <mesh position={[-8, 0, 3]}>
        <sphereGeometry args={[9, 16, 16]} />
        <meshStandardMaterial color={COLORS.cloudColor} transparent opacity={0.9} />
      </mesh>
      <mesh position={[5, 0, -7]}>
        <sphereGeometry args={[7, 16, 16]} />
        <meshStandardMaterial color={COLORS.cloudColor} transparent opacity={0.85} />
      </mesh>
      <mesh position={[-5, 0, -5]}>
        <sphereGeometry args={[8, 16, 16]} />
        <meshStandardMaterial color={COLORS.cloudColor} transparent opacity={0.85} />
      </mesh>
      {/* Thêm các quả cầu để tạo đám mây nhiều lớp, phồng lên */}
      <mesh position={[0, 3, 0]}>
        <sphereGeometry args={[9, 16, 16]} />
        <meshStandardMaterial color={COLORS.cloudColor} transparent opacity={0.8} />
      </mesh>
      <mesh position={[6, 2, 3]}>
        <sphereGeometry args={[7, 16, 16]} />
        <meshStandardMaterial color={COLORS.cloudColor} transparent opacity={0.8} />
      </mesh>
      <mesh position={[-6, 2, 2]}>
        <sphereGeometry args={[8, 16, 16]} />
        <meshStandardMaterial color={COLORS.cloudColor} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

// Component bầu trời với nhiều mây
function CloudySky() {
  // Tạo nhiều mây với vị trí khác nhau
  const clouds = useMemo(() => {
    const cloudData = [];
    for (let i = 0; i < 20; i++) { // Tăng số lượng mây từ 12 lên 20
      cloudData.push({
        position: [
          (Math.random() - 0.5) * 600, // X: -300 to 300
          90 + Math.random() * 40,     // Y: 90 to 130
          -200 - Math.random() * 200   // Z: -200 to -400 (phía sau)
        ],
        scale: 0.8 + Math.random() * 2.2,  // Scale: 0.8 to 3 (thêm một số đám mây nhỏ hơn)
        rotation: Math.random() * Math.PI * 2 // Rotation: 0 to 2π
      });
    }
    return cloudData;
  }, []);
  
  return (
    <>
      <Sun />
      {clouds.map((cloud, index) => (
        <Cloud 
          key={index} 
          position={cloud.position} 
          scale={cloud.scale} 
          rotation={cloud.rotation} 
        />
      ))}
    </>
  );
}

// Main component
export default function GltfModelViewer({ onLoad, onError }) {
  const [loading, setLoading] = useState(true);
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);
  const [modelStatus, setModelStatus] = useState({
    cat: "loading",
    house: "loading"
  });
  
  // State cho vị trí và kích thước ngôi nhà - giá trị cố định
  const housePosition = -19.8;
  const houseScale = 9;
  
  // Tham chiếu tới mô hình house
  const houseModelRef = useRef(null);
  
  // State để lưu trữ vị trí camera - không cần hiển thị nữa
  const [cameraPosition, setCameraPosition] = useState({ x: 155.1, y: 24.66, z: 13.16 });
  const [cameraTarget, setCameraTarget] = useState({ x: 104.09, y: 9.01, z: -71.42 });
  
  // Callback để nhận tham chiếu từ Model component
  const handleHouseRefReady = useCallback((ref) => {
    houseModelRef.current = ref;
    console.log("Đã nhận tham chiếu houseModelRef từ Model component");
  }, []);
  
  // Callback khi model tải xong
  const handleModelLoad = (models) => {
    console.log("Models loaded callback:", models);
    
    if (models.house) {
      setModelStatus(prev => ({ ...prev, house: "loaded" }));
      console.log("✓ Mô hình House đã tải xong");
    }
    
    if (models.cat) {
      setModelStatus(prev => ({ ...prev, cat: "loaded" }));
      console.log("✓ Mô hình Cat đã tải xong");
    }
    
    setLoading(false);
    // Đánh dấu là đã tải xong để bắt đầu animation
    setTimeout(() => {
      setIsLoadingComplete(true);
    }, 500); // Đợi một chút trước khi bắt đầu animation
    
    if (onLoad) onLoad(models);
  };
  
  // Callback khi model lỗi
  const handleModelError = (error) => {
    console.error("Model error:", error);
    if (onError) onError(error);
  };

  // Component hiệu ứng đám mây loading
  const CloudsLoadingOverlay = () => {
    // Sử dụng state để theo dõi trạng thái animation
    const [animationState, setAnimationState] = useState('initial');
    
    // Kích hoạt animation sau khi loading hoàn tất
    useEffect(() => {
      if (isLoadingComplete) {
        // Đầu tiên đánh dấu đã sẵn sàng để kích hoạt animation
        setAnimationState('ready');
        
        // Sau đó một khoảng thời gian ngắn, bắt đầu animation thực sự
        const timer = setTimeout(() => {
          setAnimationState('animate');
        }, 100);
        
        return () => clearTimeout(timer);
      }
    }, [isLoadingComplete]);
    
    return (
      <div className={`clouds-overlay ${animationState}`}>
        <div className="cloud-left">
          <div className="cloud-texture"></div>
        </div>
        <div className="cloud-right">
          <div className="cloud-texture"></div>
        </div>
        <div className="center-seam"></div>
        <div className="loading-text">
          {loading ? "Đang tải nhà hộp sữa 3D..." : "Sẵn sàng!"}
        </div>
        <style jsx>{`
          .clouds-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
            overflow: hidden;
          }
          
          .cloud-left, .cloud-right {
            position: absolute;
            top: 0;
            width: 50%;
            height: 100%;
            background-color: #FFA07A;
            overflow: hidden;
          }
          
          .cloud-left {
            left: 0;
            background: linear-gradient(to right, #FFA07A, #FFA07AEE);
            animation: slideLeft 0s ease-in-out forwards paused;
          }
          
          .cloud-right {
            right: 0;
            background: linear-gradient(to left, #FFA07A, #FFA07AEE);
            animation: slideRight 0s ease-in-out forwards paused;
          }
          
          .animate .cloud-left {
            animation: slideLeft 3s cubic-bezier(0.65, 0, 0.35, 1) forwards running;
          }
          
          .animate .cloud-right {
            animation: slideRight 3s cubic-bezier(0.65, 0, 0.35, 1) forwards running;
          }
          
          .cloud-texture {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: 
              radial-gradient(circle at 30% 50%, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 50%),
              radial-gradient(circle at 70% 20%, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 60%);
            opacity: 0.8;
          }
          
          .center-seam {
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 4px;
            height: 100%;
            background-color: #FFC0CB;
            box-shadow: 0 0 15px 5px rgba(255, 255, 255, 0.5);
            animation: fadeSeam 0s ease-in-out forwards paused;
          }
          
          .animate .center-seam {
            animation: fadeSeam 2s ease-in-out forwards running;
          }
          
          .loading-text {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-family: 'cursive', sans-serif;
            font-size: 32px;
            color: white;
            text-shadow: 0 2px 8px rgba(0,0,0,0.3);
            z-index: 5;
            white-space: nowrap;
            animation: fadeText 0s ease-in-out forwards paused;
          }
          
          .animate .loading-text {
            animation: fadeText 1.5s ease-in-out forwards running;
          }
          
          /* Định nghĩa keyframes animations */
          @keyframes slideLeft {
            0% {
              transform: translateX(0);
              opacity: 1;
            }
            100% {
              transform: translateX(-100%);
              opacity: 0.3;
              filter: blur(5px);
            }
          }
          
          @keyframes slideRight {
            0% {
              transform: translateX(0);
              opacity: 1;
            }
            100% {
              transform: translateX(100%);
              opacity: 0.3;
              filter: blur(5px);
            }
          }
          
          @keyframes fadeSeam {
            0% {
              opacity: 1;
              transform: translateX(-50%) scaleY(1);
            }
            100% {
              opacity: 0;
              transform: translateX(-50%) scaleY(1.5);
              filter: blur(10px);
            }
          }
          
          @keyframes fadeText {
            0% {
              opacity: 1;
              transform: translate(-50%, -50%) scale(1);
            }
            100% {
              opacity: 0;
              transform: translate(-50%, -50%) scale(1.2);
              filter: blur(5px);
            }
          }
          
          /* Tạo hiệu ứng lấp lánh cho đám mây */
          .cloud-left::before, .cloud-right::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: 
              radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 20%),
              radial-gradient(circle at 70% 65%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 20%),
              radial-gradient(circle at 40% 80%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 20%),
              radial-gradient(circle at 80% 15%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 20%);
            animation: sparkle 3s infinite ease-in-out;
          }
          
          .cloud-right::before {
            animation-delay: 1.5s;
          }
          
          @keyframes sparkle {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    );
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      position: 'relative',
      background: `linear-gradient(to bottom, ${COLORS.bgGradientStart} 0%, ${COLORS.bgGradientEnd} 100%)`
    }}>
      <Canvas 
        shadows
        camera={{ position: [155.1, 24.66, 13.16], fov: 45 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={[COLORS.canvasBackground]} />
        <fog attach="fog" args={[COLORS.fogColor, 40, 400]} />
        
        {/* Bầu trời với mây và mặt trời */}
        <CloudySky />
        
        {/* Ánh sáng - tăng cường để soi sáng ngôi nhà tốt hơn */}
        <ambientLight intensity={0.8} color="#FFD6A5" /> {/* Ánh sáng môi trường màu vàng cam nhẹ */}
        
        {/* Ánh sáng chính - từ vị trí mặt trời */}
        <directionalLight 
          position={[100, 80, -150]}
          intensity={1.5} 
          color="#FF9E80"
          castShadow 
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-100}
          shadow-camera-right={100}
          shadow-camera-top={100}
          shadow-camera-bottom={-100}
          shadow-bias={-0.0001}
        />
        
        {/* Ánh sáng phụ - tạo bóng đổ và tương phản */}
        <directionalLight position={[50, 50, 25]} intensity={0.5} color="#FFAB91" castShadow />
        <directionalLight position={[-50, 30, -20]} intensity={0.4} color="#B388FF" castShadow />
        
        {/* Ánh sáng môi trường */}
        <hemisphereLight intensity={0.8} color="#FFD180" groundColor={COLORS.groundColor} />
        
        <Suspense fallback={null}>
          <Model 
            onLoad={handleModelLoad} 
            onError={handleModelError}
            housePosition={housePosition}
            houseScale={houseScale}
            onHouseRefReady={handleHouseRefReady}
          />
        </Suspense>
        
        <OrbitControls 
          enableZoom={true} 
          enablePan={true}
          enableRotate={true}
          minDistance={10}
          maxDistance={400}
          minPolarAngle={Math.PI * 0.05}
          maxPolarAngle={Math.PI * 0.45}
          target={[104.09, 9.01, -71.42]} // Target điểm nhìn được chỉ định
          zoomSpeed={1.2}
          rotateSpeed={0.8}
          enableDamping={true}
          dampingFactor={0.07}
        />
      </Canvas>
      
      {/* Hiệu ứng đám mây loading */}
      <CloudsLoadingOverlay />
      
      {/* Thông tin debug ở góc màn hình */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        fontSize: '12px',
        color: '#FFD6A5',
        background: 'rgba(18, 13, 49, 0.7)',
        padding: '10px',
        borderRadius: '8px',
        maxWidth: '300px',
        zIndex: 100
      }}>
        <div>
          <strong>Status:</strong><br/>
          House: {modelStatus.house}<br/>
          Cat: {modelStatus.cat}
        </div>
        <br />
        <a href="/debug" target="_blank" style={{color: '#FFD6A5', textDecoration: 'underline'}}>
          Mở trang Debug
        </a>
      </div>
    </div>
  );
} 