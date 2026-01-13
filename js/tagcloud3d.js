/**
 * 3D球形标签云动画
 * 标签始终正面朝向用户，无背景色，随机颜色
 */
(function () {
    'use strict';

    // 随机颜色生成 - 使用柔和的颜色
    const colors = [
        '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f39c12',
        '#1abc9c', '#e91e63', '#00bcd4', '#ff5722', '#607d8b',
        '#8e44ad', '#27ae60', '#c0392b', '#2980b9', '#16a085'
    ];

    function getRandomColor() {
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // 初始化标签云
    function initTagCloud() {
        const tagContainer = document.querySelector('.tag-index');
        if (!tagContainer) return;

        const tagList = tagContainer.querySelector('.tag-list');
        if (!tagList) return;

        const tags = Array.from(tagList.querySelectorAll('.tag-list-item'));
        if (tags.length === 0) return;

        // 创建3D标签云容器
        const cloudContainer = document.createElement('div');
        cloudContainer.className = 'tag-cloud-3d';

        const cloudSphere = document.createElement('div');
        cloudSphere.className = 'tag-cloud-sphere';

        const radius = 140;
        const tagElements = [];

        // 计算球面坐标
        tags.forEach((tag, index) => {
            const phi = Math.acos(-1 + (2 * index + 1) / tags.length);
            const theta = Math.sqrt(tags.length * Math.PI) * phi;

            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);

            const tagWrapper = document.createElement('div');
            tagWrapper.className = 'tag-cloud-item';

            const link = tag.querySelector('a');
            const count = tag.querySelector('.tag-list-count');

            if (link) {
                const newLink = link.cloneNode(true);
                newLink.style.color = getRandomColor();
                tagWrapper.appendChild(newLink);

                if (count) {
                    const newCount = count.cloneNode(true);
                    newCount.style.color = 'inherit';
                    tagWrapper.appendChild(newCount);
                }

                tagElements.push({
                    element: tagWrapper,
                    x: x,
                    y: y,
                    z: z
                });

                cloudSphere.appendChild(tagWrapper);
            }
        });

        cloudContainer.appendChild(cloudSphere);

        // 隐藏原标签列表
        const tagListParent = tagList.parentElement;
        tagListParent.style.display = 'none';
        tagContainer.appendChild(cloudContainer);

        // 启动动画
        startAnimation(cloudContainer, tagElements, radius);
    }

    function startAnimation(container, tagElements, radius) {
        let angleX = 0;
        let angleY = 0;
        let targetAngleX = 0;
        let targetAngleY = 0;
        let autoRotate = true;
        let isDragging = false;
        let lastMouseX = 0;
        let lastMouseY = 0;

        let centerX = container.offsetWidth / 2;
        let centerY = container.offsetHeight / 2;

        // 窗口大小改变时更新中心点
        window.addEventListener('resize', function () {
            centerX = container.offsetWidth / 2;
            centerY = container.offsetHeight / 2;
        });

        function updatePositions() {
            const sinX = Math.sin(angleX);
            const cosX = Math.cos(angleX);
            const sinY = Math.sin(angleY);
            const cosY = Math.cos(angleY);

            tagElements.forEach(tag => {
                // 旋转变换
                let x1 = tag.x * cosY - tag.z * sinY;
                let z1 = tag.x * sinY + tag.z * cosY;
                let y1 = tag.y * cosX - z1 * sinX;
                let z2 = tag.y * sinX + z1 * cosX;

                // 透视缩放
                const scale = (radius + z2) / (2 * radius);
                const opacity = scale * 0.8 + 0.2;

                // 更新位置（保持标签正面朝向，不翻转）
                tag.element.style.transform = `translate(-50%, -50%) translate(${centerX + x1}px, ${centerY + y1}px) scale(${scale})`;
                tag.element.style.opacity = opacity;
                tag.element.style.zIndex = Math.floor(scale * 1000);
            });
        }

        function animate() {
            if (autoRotate && !isDragging) {
                targetAngleY += 0.003;
                targetAngleX += 0.001;
            }

            angleX += (targetAngleX - angleX) * 0.05;
            angleY += (targetAngleY - angleY) * 0.05;

            updatePositions();
            requestAnimationFrame(animate);
        }

        // 鼠标交互
        container.addEventListener('mousedown', (e) => {
            isDragging = true;
            autoRotate = false;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
            container.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const deltaX = e.clientX - lastMouseX;
            const deltaY = e.clientY - lastMouseY;
            targetAngleY += deltaX * 0.005;
            targetAngleX += deltaY * 0.005;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                container.style.cursor = 'grab';
                setTimeout(() => { autoRotate = true; }, 2000);
            }
        });

        // 触摸支持 - 使用 passive 优化性能
        container.addEventListener('touchstart', (e) => {
            isDragging = true;
            autoRotate = false;
            lastMouseX = e.touches[0].clientX;
            lastMouseY = e.touches[0].clientY;
        }, { passive: true });

        container.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const deltaX = e.touches[0].clientX - lastMouseX;
            const deltaY = e.touches[0].clientY - lastMouseY;
            targetAngleY += deltaX * 0.005;
            targetAngleX += deltaY * 0.005;
            lastMouseX = e.touches[0].clientX;
            lastMouseY = e.touches[0].clientY;
        }, { passive: true });

        container.addEventListener('touchend', () => {
            if (isDragging) {
                isDragging = false;
                setTimeout(() => { autoRotate = true; }, 2000);
            }
        }, { passive: true });

        // 初始位置更新
        updatePositions();
        animate();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTagCloud);
    } else {
        initTagCloud();
    }
})();
