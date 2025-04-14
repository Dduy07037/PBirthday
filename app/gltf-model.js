'use client';

import React, { useState, useEffect, useRef, Suspense, useMemo, useCallback, useImperativeHandle } from 'react';
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
  cloudColor: '#FFA07A', // Màu mây hồng cam khi hoàng hôn
  highlightColor: '#FFFFFF' // Màu viền khi hover
};

// Simple Model component that displays a 3D model
function Model({ onLoad, onError, housePosition, houseScale, onHouseRefReady, onCameraMove, onZoomChange, orbitTargetRef, orbitControlsRef }) {
  // Setup camera
  const { camera, scene } = useThree();
  const houseModelRef = useRef(); // Reference to the primitive (house.scene)
  const houseContainerRef = useRef(); // Reference to the container group
  const catModelRef = useRef();
  
  // Add hover state
  const [hovered, setHovered] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  
  // Debug function to reset zoomed state
  const resetZoomedState = () => {
    console.log("Forcing reset of zoomed state from:", zoomed, "to false");
    setZoomed(false);
    if (onZoomChange) onZoomChange(false);
  };
  
  // Track when zoomed state changes
  useEffect(() => {
    console.log("Zoomed state changed to:", zoomed);
  }, [zoomed]);
  
  // Define the exact target position - UPDATE with the new position from user
  const EXACT_POSITION = {
    x: 126.48658022678504,
    y: -2.165676964362664,
    z: -45.46558342895352
  };
  
  // Define the exact target look-at point - NEW 
  const EXACT_TARGET = {
    x: 51.05976520197271,
    y: -19.206661756215915,
    z: -122.19205213995362
  };
  
  // Debug log to verify constants
  console.log("EXACT_POSITION defined as:", EXACT_POSITION);
  console.log("EXACT_TARGET defined as:", EXACT_TARGET);
  
  // Track current camera position for parent component
  useFrame(() => {
    if (onCameraMove) {
      // Don't round the values - use exact values
      onCameraMove({
        position: {
          x: camera.position.x,
          y: camera.position.y,
          z: camera.position.z
        },
        target: orbitTargetRef?.current || { x: 0, y: 0, z: 0 }
      });
    }
  });
  
  // Original camera position and target
  const originalCameraPos = useMemo(() => new THREE.Vector3(155.1, 24.66, 13.16), []);
  const originalTarget = useMemo(() => new THREE.Vector3(104.09, 9.01, -71.42), []);
  
  // Handle click to zoom
  const handleHouseClick = useCallback(() => {
    console.log("handleHouseClick called, zoomed state:", zoomed);
    if (!zoomed) {
      // Zoom in - animate camera movement
      setZoomed(true);
      if (onZoomChange) onZoomChange(true);
      console.log("Zoom state set to true");
      
      // Disable orbit controls completely during animation
      if (orbitControlsRef.current) {
        // Use try-catch to handle potential errors with OrbitControls
        try {
          if (typeof orbitControlsRef.current.enabled !== 'undefined') {
            orbitControlsRef.current.enabled = false;
            console.log("OrbitControls disabled");
          }
          if (orbitControlsRef.current.setEnabled) {
            orbitControlsRef.current.setEnabled(false);
          }
        } catch (e) {
          console.warn("Could not disable orbit controls", e);
        }
      }
      
      // Force remove any hover effect immediately
      if (hovered) {
        setHovered(false);
        document.body.style.cursor = 'default';
      }
      
      // Get initial camera state
      const startPos = camera.position.clone();
      const startQuat = camera.quaternion.clone();
      console.log("Starting camera position:", startPos);
      
      // Define end state
      const endPos = new THREE.Vector3(
        EXACT_POSITION.x,
        EXACT_POSITION.y,
        EXACT_POSITION.z
      );
      
      const endTarget = new THREE.Vector3(
        EXACT_TARGET.x,
        EXACT_TARGET.y,
        EXACT_TARGET.z
      );
      
      console.log("Target position:", endPos);
      console.log("Target look-at:", endTarget);
      
      // Pre-calculate end quaternion for smooth rotation
      const endDirection = new THREE.Vector3().subVectors(endTarget, endPos).normalize();
      const endQuat = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, -1),
        endDirection
      );
      
      // Animation variables
      let animationFrameId = null;
      let startTime = 0;  // Changed from previousTime to startTime
      const totalDuration = 3000; // 3 seconds
      
      // Create dummy camera for intermediary calculations
      const dummyCamera = new THREE.PerspectiveCamera();
      dummyCamera.position.copy(startPos);
      dummyCamera.quaternion.copy(startQuat);
      
      console.log("Animation setup complete, starting animation...");
      
      // Animation function - time synchronized with vsync
      const animate = (time) => {
        // First frame - record start time
        if (startTime === 0) {
          startTime = time;
          console.log("Animation starting, first frame at time:", time);
          animationFrameId = requestAnimationFrame(animate);
          return;
        }
        
        // Calculate elapsed time since animation start
        const elapsedTime = time - startTime;
        
        // Calculate animation progress (0 to 1)
        const progress = Math.min(elapsedTime / totalDuration, 1.0);
        
        // Log at roughly 10% intervals
        if (Math.floor(progress * 10) !== Math.floor((progress - 0.001) * 10)) {
          console.log(`Animation progress: ${(progress * 100).toFixed(0)}%, elapsed: ${elapsedTime.toFixed(0)}ms`);
        }
        
        // Super smooth easing function
        const smoothProgress = t => {
          // Quintic ease-in-out
          return t < 0.5
            ? 16 * t * t * t * t * t
            : 1 - Math.pow(-2 * t + 2, 5) / 2;
        };
        
        const easedProgress = smoothProgress(progress);
        
        // Smoothly interpolate position
        dummyCamera.position.lerpVectors(startPos, endPos, easedProgress);
        
        // Smoothly interpolate rotation
        dummyCamera.quaternion.copy(startQuat).slerp(endQuat, easedProgress);
        
        // Apply to actual camera
        camera.position.copy(dummyCamera.position);
        camera.quaternion.copy(dummyCamera.quaternion);
        
        // Update camera matrices
        camera.updateMatrix();
        camera.updateProjectionMatrix();
        camera.updateMatrixWorld(true);
        
        // Continue animation if not complete
        if (progress < 0.999) { // Use slightly less than 1 to ensure we reach the end
          animationFrameId = requestAnimationFrame(animate);
        } else {
          // Ensure final position is exact
          camera.position.copy(endPos);
          camera.lookAt(endTarget);
          
          // Final update of matrices
          camera.updateMatrix();
          camera.updateProjectionMatrix();
          camera.updateMatrixWorld(true);
          
          // Update orbit target reference
          if (orbitTargetRef && orbitTargetRef.current) {
            orbitTargetRef.current.copy(endTarget);
          }
          
          // Notify parent
          if (onCameraMove) {
            onCameraMove({
              position: { 
                x: camera.position.x, 
                y: camera.position.y, 
                z: camera.position.z 
              },
              target: { 
                x: endTarget.x, 
                y: endTarget.y, 
                z: endTarget.z 
              }
            });
          }
          
          // Re-enable orbit controls
          if (orbitControlsRef.current) {
            try {
              if (typeof orbitControlsRef.current.enabled !== 'undefined') {
                orbitControlsRef.current.enabled = true;
                console.log("OrbitControls re-enabled after exit animation");
              }
              if (orbitControlsRef.current.setEnabled) {
                orbitControlsRef.current.setEnabled(true);
              }
            } catch (e) {
              console.warn("Could not re-enable orbit controls", e);
            }
          }
          
          console.log("Animation complete - camera at target position:", camera.position);
        }
      };
      
      // Start animation
      animationFrameId = requestAnimationFrame(animate);
      console.log("Animation started, frame ID:", animationFrameId);
      
      // Return cleanup
      return () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          console.log("Animation cleanup triggered");
        }
      };
    }
  }, [camera, orbitTargetRef, orbitControlsRef, zoomed, hovered, onZoomChange, onCameraMove, EXACT_POSITION, EXACT_TARGET]);
  
  // Exit zoom function with the same improved animation
  const exitZoom = useCallback(() => {
    if (!zoomed) return;
    
    console.log("exitZoom called, current zoomed state:", zoomed);
    
    // Update state
    setZoomed(false);
    if (onZoomChange) onZoomChange(false);
    
    // Try to disable orbit controls during animation
    if (orbitControlsRef.current) {
      try {
        if (typeof orbitControlsRef.current.enabled !== 'undefined') {
          orbitControlsRef.current.enabled = false;
          console.log("OrbitControls disabled during exit animation");
        }
        if (orbitControlsRef.current.setEnabled) {
          orbitControlsRef.current.setEnabled(false);
        }
      } catch (e) {
        console.warn("Could not disable orbit controls", e);
      }
    }
    
    // Get initial camera state
    const startPos = camera.position.clone();
    const startQuat = camera.quaternion.clone();
    
    // Define end state
    const endPos = originalCameraPos.clone();
    const endTarget = originalTarget.clone();
    
    console.log("Exit zoom - moving from:", startPos);
    console.log("Exit zoom - moving to:", endPos);
    console.log("Exit zoom - target:", endTarget);
    
    // Pre-calculate end quaternion for smooth rotation
    const endDirection = new THREE.Vector3().subVectors(endTarget, endPos).normalize();
    const endQuat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, -1),
      endDirection
    );
    
    // Animation variables
    let animationFrameId = null;
    let startTime = 0;
    const totalDuration = 3000; // 3 seconds
    
    // Create dummy camera for intermediary calculations
    const dummyCamera = new THREE.PerspectiveCamera();
    dummyCamera.position.copy(startPos);
    dummyCamera.quaternion.copy(startQuat);
    
    // Animation function - time synchronized with vsync
    const animate = (time) => {
      // First frame - record start time
      if (startTime === 0) {
        startTime = time;
        console.log("Exit animation starting, first frame at time:", time);
        animationFrameId = requestAnimationFrame(animate);
        return;
      }
      
      // Calculate elapsed time since animation start
      const elapsedTime = time - startTime;
      
      // Calculate animation progress (0 to 1)
      const progress = Math.min(elapsedTime / totalDuration, 1.0);
      
      // Log at roughly 10% intervals
      if (Math.floor(progress * 10) !== Math.floor((progress - 0.001) * 10)) {
        console.log(`Exit animation progress: ${(progress * 100).toFixed(0)}%, elapsed: ${elapsedTime.toFixed(0)}ms`);
      }
      
      // Super smooth easing function
      const smoothProgress = t => {
        // Quintic ease-in-out
        return t < 0.5
          ? 16 * t * t * t * t * t
          : 1 - Math.pow(-2 * t + 2, 5) / 2;
      };
      
      const easedProgress = smoothProgress(progress);
      
      // Smoothly interpolate position
      dummyCamera.position.lerpVectors(startPos, endPos, easedProgress);
      
      // Smoothly interpolate rotation
      dummyCamera.quaternion.copy(startQuat).slerp(endQuat, easedProgress);
      
      // Apply to actual camera
      camera.position.copy(dummyCamera.position);
      camera.quaternion.copy(dummyCamera.quaternion);
      
      // Update camera matrices
      camera.updateMatrix();
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld(true);
      
      // Continue animation if not complete
      if (progress < 0.999) { // Use slightly less than 1 to ensure we reach the end
        animationFrameId = requestAnimationFrame(animate);
      } else {
        // Ensure final position is exact
        camera.position.copy(endPos);
        camera.lookAt(endTarget);
        
        // Final update of matrices
        camera.updateMatrix();
        camera.updateProjectionMatrix();
        camera.updateMatrixWorld(true);
        
        // Update orbit target reference
        if (orbitTargetRef && orbitTargetRef.current) {
          orbitTargetRef.current.copy(endTarget);
        }
        
        // Notify parent
        if (onCameraMove) {
          onCameraMove({
            position: { 
              x: camera.position.x, 
              y: camera.position.y, 
              z: camera.position.z 
            },
            target: { 
              x: endTarget.x, 
              y: endTarget.y, 
              z: endTarget.z 
            }
          });
        }
        
        // Re-enable orbit controls
        if (orbitControlsRef.current) {
          try {
            if (typeof orbitControlsRef.current.enabled !== 'undefined') {
              orbitControlsRef.current.enabled = true;
              console.log("OrbitControls re-enabled after exit animation");
            }
            if (orbitControlsRef.current.setEnabled) {
              orbitControlsRef.current.setEnabled(true);
            }
          } catch (e) {
            console.warn("Could not re-enable orbit controls", e);
          }
        }
        
        console.log("Exit animation complete - camera at original position:", camera.position);
      }
    };
    
    // Start animation
    animationFrameId = requestAnimationFrame(animate);
    
    // Return cleanup
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [camera, orbitTargetRef, orbitControlsRef, zoomed, onZoomChange, originalCameraPos, originalTarget]);
  
  // Make exitZoom available to parent component
  useEffect(() => {
    if (onHouseRefReady) {
      onHouseRefReady({
        ref: houseContainerRef.current, // Send the container ref to parent
        modelRef: houseModelRef.current, // Also send direct model ref if needed
        exitZoom
      });
    }
  }, [houseModelRef.current, houseContainerRef.current, exitZoom, onHouseRefReady]);
  
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
  
  // Update container position instead of directly updating model
  useEffect(() => {
    if (houseContainerRef.current) {
      houseContainerRef.current.position.y = housePosition;
      console.log(`Vị trí Y của ngôi nhà đã được cập nhật: ${housePosition}`);
    }
  }, [housePosition]);
  
  // Update container scale instead of directly updating model
  useEffect(() => {
    if (houseContainerRef.current) {
      houseContainerRef.current.scale.set(houseScale, houseScale, houseScale);
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
  
  // Setup mô hình house với hoạt ảnh hover
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
          
          // Lưu trữ vật liệu gốc
          child._originalMaterial = child.material.clone();
          
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
  
  // Handle hover effect
  useEffect(() => {
    if (houseModelRef.current && house.scene) {
      house.scene.traverse((child) => {
        if (child.isMesh && child.material) {
          // Only apply hover effect when not zoomed in
          if (hovered && !zoomed) {
            // Add glow effect when hovered
            child.material.emissive = new THREE.Color(0xFFFFFF);
            child.material.emissiveIntensity = 0.2;
          } else {
            // Remove glow effect
            child.material.emissive = new THREE.Color(0x000000);
            child.material.emissiveIntensity = 0;
          }
          child.material.needsUpdate = true;
        }
      });
    }
  }, [hovered, house.scene, zoomed]);
  
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
      
      {/* Mô hình House (ở giữa) với hover và click - only clickable when not zoomed */}
      {house.scene && (
        <group
          ref={houseContainerRef}
          position={[0, housePosition, 0]}
          rotation={[0, Math.PI / 4, 0]}
          scale={[houseScale, houseScale, houseScale]}
          onPointerOver={() => {
            if (!zoomed) {
              setHovered(true);
              document.body.style.cursor = 'pointer';
              console.log("House hovered");
            }
          }}
          onPointerOut={() => {
            if (!zoomed) {
              setHovered(false);
              document.body.style.cursor = 'default';
              console.log("House hover ended");
            }
          }}
          onClick={(event) => {
            // Prevent event propagation
            event.stopPropagation();
            console.log("House CLICKED at coordinates:", event.point, "zoomed state:", zoomed);
            
            // Force reset zoomed state if it's stuck
            if (zoomed) {
              resetZoomedState();
              return;
            }
            
            if (!zoomed) {
              console.log("Calling handleHouseClick(), zoomed state is false");
              handleHouseClick();
            } else {
              console.log("NOT calling handleHouseClick() because zoomed is true");
            }
          }}
        >
          <primitive 
            ref={houseModelRef}
            object={house.scene}
          />
        </group>
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
  
  // Replace the camera control state with a more comprehensive one
  const [cameraControl, setCameraControl] = useState({
    position: { x: 155.1, y: 24.66, z: 13.16 },
    rotation: { x: 0, y: 0, z: 0 },
    target: { x: 104.09, y: 9.01, z: -71.42 },
    step: 1.0 // Size of movement step
  });
  
  // Add separate state for input values to prevent jumping
  const [inputValues, setInputValues] = useState({
    position: { x: "155.1", y: "24.66", z: "13.16" },
    target: { x: "104.09", y: "9.01", z: "-71.42" }
  });
  
  // State to track if we're zoomed in
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  
  // Ref to store the exitZoom function
  const exitZoomRef = useRef(null);
  
  // Custom camera position state (used for the external UI controls)
  const [customCameraPosition, setCustomCameraPosition] = useState({
    x: 114.71,
    y: 3.87,
    z: -35.83,
    apply: false
  });
  
  // Add rotation controls state
  const [rotationControls, setRotationControls] = useState({
    enableRotation: false,
    speed: 0.01,
    axis: 'y' // 'x', 'y', 'z', or 'free'
  });
  
  // Ref for the scene group that will rotate
  const sceneGroupRef = useRef(null);
  
  // Track camera position changes - store exact values
  const handleCameraMove = useCallback((cameraData) => {
    setCameraControl({
      position: {
        x: cameraData.position.x,
        y: cameraData.position.y,
        z: cameraData.position.z
      },
      target: cameraData.target
    });
  }, []);
  
  // Handle applying custom camera position
  const applyCustomPosition = () => {
    setCustomCameraPosition(prev => ({
      ...prev,
      apply: true
    }));
    
    // Reset the apply flag after a short delay
    setTimeout(() => {
      setCustomCameraPosition(prev => ({
        ...prev,
        apply: false
      }));
    }, 100);
  };
  
  // Handle zoom state changes
  const handleZoomChange = useCallback((zoomedIn) => {
    setIsZoomedIn(zoomedIn);
  }, []);
  
  // Store house ref and exit function
  const handleHouseRefReady = useCallback((data) => {
    if (data && data.ref) {
      houseModelRef.current = data.ref;
      exitZoomRef.current = data.exitZoom;
    console.log("Đã nhận tham chiếu houseModelRef từ Model component");
    }
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

  // Ref for OrbitControls
  const orbitControlsRef = useRef(null);

  // Handle rotation axis change
  const handleRotationAxisChange = (axis) => {
    setRotationControls(prev => ({
      ...prev,
      axis,
      enableRotation: true
    }));
  };

  // Toggle rotation on/off
  const toggleRotation = () => {
    setRotationControls(prev => ({
      ...prev,
      enableRotation: !prev.enableRotation
    }));
  };

  // Adjust rotation speed
  const adjustRotationSpeed = (speed) => {
    setRotationControls(prev => ({
      ...prev,
      speed
    }));
  };

  // Handle camera step movement
  const moveCameraStep = (axis, direction, isRotation = false) => {
    const stepSize = cameraControl.step * direction;
    
    // Get camera from OrbitControls
    const camera = orbitControlsRef.current?.object;
    const controls = orbitControlsRef.current;
    
    if (camera && controls) {
      if (isRotation) {
        // Handle rotation
        camera.rotation[axis] += stepSize * 0.01;
        
        // Update state
        setCameraControl(prev => {
          const newState = {
            ...prev,
            rotation: {
              ...prev.rotation,
              [axis]: camera.rotation[axis]
            }
          };
          
          // Also update input values
          setInputValues(prevInputs => ({
            ...prevInputs,
            rotation: {
              ...prevInputs.rotation,
              [axis]: camera.rotation[axis].toString()
            }
          }));
          
          return newState;
        });
      } else {
        // Handle position
        if (axis === 'target-x' || axis === 'target-y' || axis === 'target-z') {
          // Move the orbit controls target
          const targetAxis = axis.split('-')[1];
          controls.target[targetAxis] += stepSize;
          controls.update();
          
          // Update state
          setCameraControl(prev => {
            const newValue = controls.target[targetAxis];
            
            // Also update input values
            setInputValues(prevInputs => ({
              ...prevInputs,
              target: {
                ...prevInputs.target,
                [targetAxis]: newValue.toString()
              }
            }));
            
            return {
              ...prev,
              target: {
                ...prev.target,
                [targetAxis]: newValue
              }
            };
          });
        } else {
          // Move the camera position
          camera.position[axis] += stepSize;
          
          // Update state
          setCameraControl(prev => {
            const newValue = camera.position[axis];
            
            // Also update input values
            setInputValues(prevInputs => ({
              ...prevInputs,
              position: {
                ...prevInputs.position,
                [axis]: newValue.toString()
              }
            }));
            
            return {
              ...prev,
              position: {
                ...prev.position,
                [axis]: newValue
              }
            };
          });
        }
        
        // Update matrices
        camera.updateMatrix();
        camera.updateMatrixWorld();
        camera.updateProjectionMatrix();
      }
      
      // Log the current position for reference
      console.log("Camera Position:", 
        camera.position.x.toFixed(2),
        camera.position.y.toFixed(2),
        camera.position.z.toFixed(2)
      );
      console.log("Target Position:", 
        controls.target.x.toFixed(2),
        controls.target.y.toFixed(2),
        controls.target.z.toFixed(2)
      );
    }
  };
  
  // Handle direct input for coordinates - only update input values, not actual camera
  const handleCoordinateInput = (type, axis, value) => {
    // Update only the input state, don't parse to number yet
    setInputValues(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [axis]: value
      }
    }));
  };
  
  // Apply camera position from inputs
  const applyCamera = () => {
    const camera = orbitControlsRef.current?.object;
    const controls = orbitControlsRef.current;
    
    if (camera && controls) {
      // Parse input values to numbers and update camera control state
      const newPosition = {
        x: parseFloat(inputValues.position.x) || 0,
        y: parseFloat(inputValues.position.y) || 0,
        z: parseFloat(inputValues.position.z) || 0
      };
      
      const newTarget = {
        x: parseFloat(inputValues.target.x) || 0,
        y: parseFloat(inputValues.target.y) || 0,
        z: parseFloat(inputValues.target.z) || 0
      };
      
      // Update camera control state
      setCameraControl(prev => ({
        ...prev,
        position: newPosition,
        target: newTarget
      }));
      
      // Set camera position
      camera.position.set(
        newPosition.x,
        newPosition.y,
        newPosition.z
      );
      
      // Set target
      controls.target.set(
        newTarget.x,
        newTarget.y,
        newTarget.z
      );
      
      // Update controls and matrices
      controls.update();
      camera.updateMatrix();
      camera.updateMatrixWorld();
      camera.updateProjectionMatrix();
      
      console.log("Applied camera position:", 
        camera.position.x, camera.position.y, camera.position.z
      );
      console.log("Applied target:", 
        controls.target.x, controls.target.y, controls.target.z
      );
    }
  };
  
  // Get current camera position from OrbitControls
  const getCurrentCamera = () => {
    const camera = orbitControlsRef.current?.object;
    const controls = orbitControlsRef.current;
    
    if (camera && controls) {
      const newPosition = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z
      };
      
      const newTarget = {
        x: controls.target.x,
        y: controls.target.y,
        z: controls.target.z
      };
      
      // Update both states
      setCameraControl(prev => ({
        ...prev,
        position: newPosition,
        rotation: {
          x: camera.rotation.x,
          y: camera.rotation.y,
          z: camera.rotation.z
        },
        target: newTarget
      }));
      
      // Update input values as strings
      setInputValues({
        position: {
          x: newPosition.x.toString(),
          y: newPosition.y.toString(),
          z: newPosition.z.toString()
        },
        target: {
          x: newTarget.x.toString(),
          y: newTarget.y.toString(),
          z: newTarget.z.toString()
        }
      });
      
      console.log("Retrieved current camera position:", 
        camera.position.x.toFixed(2),
        camera.position.y.toFixed(2),
        camera.position.z.toFixed(2)
      );
    }
  };
  
  // Save camera position to localStorage
  const saveCameraPosition = () => {
    localStorage.setItem('savedCameraPosition', JSON.stringify(cameraControl));
    alert("Đã lưu vị trí camera thành công!");
    console.log("Saved camera position:", cameraControl);
  };
  
  // Load camera position from localStorage
  const loadCameraPosition = () => {
    const savedPosition = localStorage.getItem('savedCameraPosition');
    if (savedPosition) {
      const parsedPosition = JSON.parse(savedPosition);
      setCameraControl(parsedPosition);
      console.log("Loaded camera position:", parsedPosition);
    } else {
      alert("Không tìm thấy vị trí đã lưu!");
    }
  };

  // Add a ref to store the OrbitControls target
  const orbitTargetRef = useRef(new THREE.Vector3(104.09, 9.01, -71.42));
  
  // Callback to track orbit controls target changes
  const handleOrbitUpdate = useCallback((self) => {
    if (self && self.target) {
      // Store orbit controls target in our ref for animation functions
      orbitTargetRef.current = self.target.clone();
    }
  }, []);

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
            onCameraMove={handleCameraMove}
            onZoomChange={handleZoomChange}
            orbitTargetRef={orbitTargetRef}
            orbitControlsRef={orbitControlsRef}
          />
        </Suspense>
        
        <OrbitControlsWrapper
          ref={orbitControlsRef}
          isZoomedIn={isZoomedIn}
          makeDefault
          minDistance={10}
          maxDistance={400}
          minPolarAngle={Math.PI * 0.05}
          maxPolarAngle={Math.PI * 0.45}
          target={[104.09, 9.01, -71.42]} // Target điểm nhìn được chỉ định
          zoomSpeed={1.2}
          rotateSpeed={0.8}
          enableDamping={true}
          dampingFactor={0.07}
          onUpdate={handleOrbitUpdate}
        />
        
        {/* CameraPositionSynchronizer - A THREE.js component that updates camera position when needed */}
        <CameraPositionSynchronizer 
          cameraControl={cameraControl}
          isZoomedIn={isZoomedIn}
          controlsRef={orbitControlsRef}
        />
      </Canvas>
      
      {/* Hiệu ứng đám mây loading */}
      <CloudsLoadingOverlay />
      
      {/* Advanced Camera Control Panel - MOVED OUTSIDE CANVAS */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        zIndex: 1000,
        fontFamily: 'monospace',
        width: '300px',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
        <div style={{ 
          fontWeight: 'bold', 
          textAlign: 'center', 
          marginBottom: '10px',
          fontSize: '16px'
        }}>
          Điều Khiển Camera Chính Xác
        </div>
        
        {/* Step size control */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Bước di chuyển:
          </label>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {[0.1, 0.5, 1, 5, 10].map(step => (
              <button 
                key={step}
                onClick={() => setCameraControl(prev => ({ ...prev, step }))}
                style={{
                  background: cameraControl.step === step ? '#FF7E5F' : '#444',
                  color: 'white',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                {step}
              </button>
            ))}
          </div>
        </div>
        
        {/* Position Controls */}
        <div style={{ 
          marginBottom: '15px', 
          padding: '10px', 
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '6px' 
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Vị Trí Camera:</div>
          
          {/* X Position */}
          <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '20px' }}>X:</div>
            <input
              type="text"
              value={inputValues.position.x}
              onChange={(e) => handleCoordinateInput('position', 'x', e.target.value)}
              style={{ 
                flex: 1,
                margin: '0 10px',
                background: '#222', 
                color: 'white', 
                border: '1px solid #444', 
                padding: '4px' 
              }}
            />
            <button 
              onClick={() => moveCameraStep('x', -1)}
              style={{ width: '30px', background: '#555', border: 'none', color: 'white', borderRadius: '4px' }}
            >-</button>
            <button 
              onClick={() => moveCameraStep('x', 1)}
              style={{ width: '30px', background: '#555', border: 'none', color: 'white', borderRadius: '4px', marginLeft: '5px' }}
            >+</button>
          </div>
          
          {/* Y Position */}
          <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '20px' }}>Y:</div>
            <input
              type="text"
              value={inputValues.position.y}
              onChange={(e) => handleCoordinateInput('position', 'y', e.target.value)}
              style={{ 
                flex: 1,
                margin: '0 10px',
                background: '#222', 
                color: 'white', 
                border: '1px solid #444', 
                padding: '4px' 
              }}
            />
            <button 
              onClick={() => moveCameraStep('y', -1)}
              style={{ width: '30px', background: '#555', border: 'none', color: 'white', borderRadius: '4px' }}
            >-</button>
            <button 
              onClick={() => moveCameraStep('y', 1)}
              style={{ width: '30px', background: '#555', border: 'none', color: 'white', borderRadius: '4px', marginLeft: '5px' }}
            >+</button>
          </div>
          
          {/* Z Position */}
          <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '20px' }}>Z:</div>
            <input
              type="text"
              value={inputValues.position.z}
              onChange={(e) => handleCoordinateInput('position', 'z', e.target.value)}
              style={{ 
                flex: 1,
                margin: '0 10px',
                background: '#222', 
                color: 'white', 
                border: '1px solid #444', 
                padding: '4px' 
              }}
            />
            <button 
              onClick={() => moveCameraStep('z', -1)}
              style={{ width: '30px', background: '#555', border: 'none', color: 'white', borderRadius: '4px' }}
            >-</button>
            <button 
              onClick={() => moveCameraStep('z', 1)}
              style={{ width: '30px', background: '#555', border: 'none', color: 'white', borderRadius: '4px', marginLeft: '5px' }}
            >+</button>
          </div>
        </div>
        
        {/* Target Controls */}
        <div style={{ 
          marginBottom: '15px', 
          padding: '10px', 
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '6px' 
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Điểm Nhìn (Target):</div>
          
          {/* X Target */}
          <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '20px' }}>X:</div>
            <input
              type="text"
              value={inputValues.target.x}
              onChange={(e) => handleCoordinateInput('target', 'x', e.target.value)}
              style={{ 
                flex: 1,
                margin: '0 10px',
                background: '#222', 
                color: 'white', 
                border: '1px solid #444', 
                padding: '4px' 
              }}
            />
            <button 
              onClick={() => moveCameraStep('target-x', -1)}
              style={{ width: '30px', background: '#555', border: 'none', color: 'white', borderRadius: '4px' }}
            >-</button>
            <button 
              onClick={() => moveCameraStep('target-x', 1)}
              style={{ width: '30px', background: '#555', border: 'none', color: 'white', borderRadius: '4px', marginLeft: '5px' }}
            >+</button>
          </div>
          
          {/* Y Target */}
          <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '20px' }}>Y:</div>
            <input
              type="text"
              value={inputValues.target.y}
              onChange={(e) => handleCoordinateInput('target', 'y', e.target.value)}
              style={{ 
                flex: 1,
                margin: '0 10px',
                background: '#222', 
                color: 'white', 
                border: '1px solid #444', 
                padding: '4px' 
              }}
            />
            <button 
              onClick={() => moveCameraStep('target-y', -1)}
              style={{ width: '30px', background: '#555', border: 'none', color: 'white', borderRadius: '4px' }}
            >-</button>
            <button 
              onClick={() => moveCameraStep('target-y', 1)}
              style={{ width: '30px', background: '#555', border: 'none', color: 'white', borderRadius: '4px', marginLeft: '5px' }}
            >+</button>
          </div>
          
          {/* Z Target */}
          <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '20px' }}>Z:</div>
            <input
              type="text"
              value={inputValues.target.z}
              onChange={(e) => handleCoordinateInput('target', 'z', e.target.value)}
              style={{ 
                flex: 1,
                margin: '0 10px',
                background: '#222', 
                color: 'white', 
                border: '1px solid #444', 
                padding: '4px' 
              }}
            />
            <button 
              onClick={() => moveCameraStep('target-z', -1)}
              style={{ width: '30px', background: '#555', border: 'none', color: 'white', borderRadius: '4px' }}
            >-</button>
            <button 
              onClick={() => moveCameraStep('target-z', 1)}
              style={{ width: '30px', background: '#555', border: 'none', color: 'white', borderRadius: '4px', marginLeft: '5px' }}
            >+</button>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <button
            onClick={getCurrentCamera}
            style={{
              background: '#4a90e2',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              width: '48%'
            }}
          >
            Lấy vị trí hiện tại
          </button>
          
          <button
            onClick={applyCamera}
            style={{
              background: '#FF7E5F',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              width: '48%'
            }}
          >
            Áp dụng vị trí
          </button>
        </div>
        
        {/* Save/Load Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button
            onClick={saveCameraPosition}
            style={{
              background: '#27ae60',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              width: '48%'
            }}
          >
            Lưu vị trí
          </button>
          
          <button
            onClick={loadCameraPosition}
            style={{
              background: '#f39c12',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              width: '48%'
            }}
          >
            Tải vị trí đã lưu
          </button>
        </div>
        
        {/* Copy code button */}
        <button
          onClick={() => {
            const codeString = `camera.position.set(${cameraControl.position.x}, ${cameraControl.position.y}, ${cameraControl.position.z});\ncamera.lookAt(${cameraControl.target.x}, ${cameraControl.target.y}, ${cameraControl.target.z});`;
            navigator.clipboard.writeText(codeString);
            alert("Đã sao chép code vào clipboard!");
          }}
          style={{
            background: '#9b59b6',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            width: '100%',
            marginTop: '10px'
          }}
        >
          Sao chép code
        </button>
      </div>
      
      {/* Exit button - only visible when zoomed in */}
      {isZoomedIn && (
        <button
          onClick={() => exitZoomRef.current && exitZoomRef.current()}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.8)',
            border: 'none',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            fontSize: '18px',
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            transition: 'all 0.3s ease'
          }}
        >
          ✕
        </button>
      )}
      
      {/* Thêm hướng dẫn tương tác - only visible when not zoomed in */}
      {!isZoomedIn && (
        <div style={{
          position: 'absolute',
          bottom: '50px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'white',
          fontSize: '16px',
          padding: '10px 20px',
          borderRadius: '20px',
          background: 'rgba(0,0,0,0.5)',
          pointerEvents: 'none',
          zIndex: 100,
          textAlign: 'center',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)'
        }}>
          Di chuột vào ngôi nhà để xem gần hơn!
        </div>
      )}
      
      {/* Hiển thị tọa độ camera - show exact values with more decimal places */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        color: 'white',
        fontSize: '14px',
        padding: '10px',
        borderRadius: '8px',
        background: 'rgba(0,0,0,0.6)',
        zIndex: 100,
        fontFamily: 'monospace'
      }}>
        <div><b>Camera Position:</b></div>
        <div>X: {cameraControl.position.x.toFixed(2)}</div>
        <div>Y: {cameraControl.position.y.toFixed(2)}</div>
        <div>Z: {cameraControl.position.z.toFixed(2)}</div>
      </div>
      
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

// New Three.js component to synchronize camera with controls
// This component only contains Three.js compatible code
function CameraPositionSynchronizer({ cameraControl, isZoomedIn, controlsRef }) {
  const { camera } = useThree();
  
  // Track when we need to apply camera position
  const [needsUpdate, setNeedsUpdate] = useState(false);
  
  // Listen for changes in cameraControl and toggle needsUpdate flag
  useEffect(() => {
    setNeedsUpdate(true);
    
    // Clear flag after a short time to prevent continuous updates
    const timer = setTimeout(() => {
      setNeedsUpdate(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [cameraControl]);
  
  // Apply camera position when needed
  useEffect(() => {
    if (needsUpdate && isZoomedIn) {
      // Apply exact position for zoomed in state
      if (camera) {
        camera.position.set(
          cameraControl.position.x,
          cameraControl.position.y,
          cameraControl.position.z
        );
        
        // Update matrices
        camera.updateMatrix();
        camera.updateMatrixWorld();
        camera.updateProjectionMatrix();
        
        console.log("Applied camera position from synchronizer:", 
          camera.position.x, camera.position.y, camera.position.z
        );
      }
      
      // Update orbit controls target
      if (controlsRef.current) {
        controlsRef.current.target.set(
          cameraControl.target.x,
          cameraControl.target.y,
          cameraControl.target.z
        );
        controlsRef.current.update();
      }
    }
  }, [camera, controlsRef, cameraControl, needsUpdate, isZoomedIn]);
  
  return null;
}

// Create a wrapper for OrbitControls that handles animation states
const OrbitControlsWrapper = React.forwardRef((props, ref) => {
  const { isZoomedIn, ...rest } = props;
  const controlsEnabled = !isZoomedIn;
  
  console.log("OrbitControlsWrapper rendered, controls enabled:", controlsEnabled, "isZoomedIn:", isZoomedIn);
  
  // Get OrbitControls reference
  const controlsRef = useRef();
  
  // Forward ref
  useImperativeHandle(ref, () => {
    console.log("ImperativeHandle setup for OrbitControls");
    return {
      // Forward all properties and methods from OrbitControls
      ...controlsRef.current,
      // Add custom method to temporarily disable/enable controls
      setEnabled: (enabled) => {
        console.log("setEnabled called with:", enabled);
        if (controlsRef.current) {
          controlsRef.current.enabled = enabled;
        }
      }
    };
  }, [controlsRef.current]);
  
  return (
    <OrbitControls 
      ref={controlsRef}
      enableZoom={controlsEnabled} 
      enablePan={controlsEnabled}
      enableRotate={controlsEnabled}
      enabled={controlsEnabled}
      {...rest}
    />
  );
}); 