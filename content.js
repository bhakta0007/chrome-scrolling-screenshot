// Main content script for screenshot functionality
(function() {
  'use strict';

  // Prevent multiple injections
  if (window.screenshotExtensionInjected) {
    return;
  }
  window.screenshotExtensionInjected = true;

  let overlay = null;
  let selectionBox = null;
  let controls = null;
  let isDrawing = false;
  let isDragging = false;
  let dragHandle = null;
  let startX = 0;
  let startY = 0;
  let selectionRect = { x: 0, y: 0, width: 0, height: 0 };
  let scrollOffsetX = 0;
  let scrollOffsetY = 0;
  let initialScrollTop = 0;
  let initialScrollLeft = 0;
  let maxScrollReached = 0;
  let autoScrollInterval = null;
  let autoScrollX = 0;
  let autoScrollY = 0;
  let scrollContainer = null;
  const EDGE_THRESHOLD = 50; // pixels from edge to trigger auto-scroll
  const SCROLL_SPEED = 10; // pixels per scroll step

  // Initialize the screenshot tool
  function init() {
    // Save original body overflow style
    document.body.dataset.originalOverflow = document.body.style.overflow || '';

    // Find the actual scroll container
    findScrollContainer();

    createOverlay();
    createSelectionBox();
    createControls();
    attachEventListeners();
  }

  function findScrollContainer() {
    // Check if window is scrollable
    if (document.documentElement.scrollHeight > document.documentElement.clientHeight) {
      scrollContainer = window;
      return;
    }

    // Find scrollable elements
    const allElements = document.querySelectorAll('*');
    for (let element of allElements) {
      const style = window.getComputedStyle(element);
      const hasScroll = (style.overflow === 'auto' || style.overflow === 'scroll' ||
                        style.overflowY === 'auto' || style.overflowY === 'scroll');

      if (hasScroll && element.scrollHeight > element.clientHeight) {
        scrollContainer = element;
        return;
      }
    }

    // Default to window
    scrollContainer = window;
  }

  function createOverlay() {
    overlay = document.createElement('div');
    overlay.id = 'screenshot-overlay';
    document.body.appendChild(overlay);
  }

  function createSelectionBox() {
    selectionBox = document.createElement('div');
    selectionBox.id = 'screenshot-selection';
    selectionBox.style.display = 'none';

    // Create corner handles
    const positions = ['nw', 'ne', 'sw', 'se'];
    positions.forEach(pos => {
      const handle = document.createElement('div');
      handle.className = `screenshot-handle ${pos}`;
      handle.dataset.position = pos;
      selectionBox.appendChild(handle);
    });

    document.body.appendChild(selectionBox);
  }

  function createControls() {
    controls = document.createElement('div');
    controls.id = 'screenshot-controls';

    const info = document.createElement('span');
    info.id = 'screenshot-info';
    info.textContent = 'Draw a rectangle to select area';

    const captureBtn = document.createElement('button');
    captureBtn.id = 'screenshot-capture-btn';
    captureBtn.textContent = 'Capture Screenshot';
    captureBtn.onclick = captureScreenshot;

    const cancelBtn = document.createElement('button');
    cancelBtn.id = 'screenshot-cancel-btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = cleanup;

    controls.appendChild(info);
    controls.appendChild(captureBtn);
    controls.appendChild(cancelBtn);
    document.body.appendChild(controls);
  }

  function attachEventListeners() {
    overlay.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);

    // Handle scroll events
    window.addEventListener('scroll', handleScroll, true);

    // Handle corner dragging
    const handles = selectionBox.querySelectorAll('.screenshot-handle');
    handles.forEach(handle => {
      handle.addEventListener('mousedown', handleHandleMouseDown);
    });
  }

  function handleMouseDown(e) {
    if (e.target !== overlay) return;

    isDrawing = true;

    // Track initial scroll position
    if (scrollContainer === window) {
      initialScrollTop = window.scrollY;
      initialScrollLeft = window.scrollX;
    } else {
      initialScrollTop = scrollContainer.scrollTop;
      initialScrollLeft = scrollContainer.scrollLeft;
    }
    maxScrollReached = initialScrollTop;

    // Store as container-relative coordinates
    if (scrollContainer === window) {
      startX = e.clientX + initialScrollLeft;
      startY = e.clientY + initialScrollTop;
    } else {
      const containerRect = scrollContainer.getBoundingClientRect();
      startX = (e.clientX - containerRect.left) + initialScrollLeft;
      startY = (e.clientY - containerRect.top) + initialScrollTop;
    }

    selectionRect = { x: startX, y: startY, width: 0, height: 0 };

    selectionBox.style.display = 'block';
    updateSelectionBox();
  }

  function handleMouseMove(e) {
    if (isDrawing) {
      const currentScrollTop = scrollContainer === window ? window.scrollY : scrollContainer.scrollTop;
      const currentScrollLeft = scrollContainer === window ? window.scrollX : scrollContainer.scrollLeft;

      let currentX, currentY;
      if (scrollContainer === window) {
        currentX = e.clientX + currentScrollLeft;
        currentY = e.clientY + currentScrollTop;
      } else {
        const containerRect = scrollContainer.getBoundingClientRect();
        currentX = (e.clientX - containerRect.left) + currentScrollLeft;
        currentY = (e.clientY - containerRect.top) + currentScrollTop;
      }

      selectionRect.width = currentX - selectionRect.x;
      selectionRect.height = currentY - selectionRect.y;

      updateSelectionBox();
      checkAutoScroll(e.clientX, e.clientY);
    } else if (isDragging && dragHandle) {
      const currentScrollTop = scrollContainer === window ? window.scrollY : scrollContainer.scrollTop;
      const currentScrollLeft = scrollContainer === window ? window.scrollX : scrollContainer.scrollLeft;

      let currentX, currentY;
      if (scrollContainer === window) {
        currentX = e.clientX + currentScrollLeft;
        currentY = e.clientY + currentScrollTop;
      } else {
        const containerRect = scrollContainer.getBoundingClientRect();
        currentX = (e.clientX - containerRect.left) + currentScrollLeft;
        currentY = (e.clientY - containerRect.top) + currentScrollTop;
      }

      handleCornerDrag(dragHandle, currentX, currentY);
      updateSelectionBox();
      updateInfoText();
      checkAutoScroll(e.clientX, e.clientY);
    }
  }

  function handleMouseUp(e) {
    if (isDrawing) {
      isDrawing = false;

      // Normalize negative dimensions
      if (selectionRect.width < 0) {
        selectionRect.x += selectionRect.width;
        selectionRect.width = Math.abs(selectionRect.width);
      }
      if (selectionRect.height < 0) {
        selectionRect.y += selectionRect.height;
        selectionRect.height = Math.abs(selectionRect.height);
      }

      if (selectionRect.width > 10 && selectionRect.height > 10) {
        controls.classList.add('visible');
        updateInfoText();
      }

      updateSelectionBox();
      stopAutoScroll();
    } else if (isDragging) {
      isDragging = false;
      dragHandle = null;
      stopAutoScroll();
    }
  }

  function handleHandleMouseDown(e) {
    e.preventDefault();
    e.stopPropagation();

    isDragging = true;
    dragHandle = e.target.dataset.position;
  }

  function handleCornerDrag(position, mouseX, mouseY) {
    const rect = { ...selectionRect };

    switch(position) {
      case 'nw':
        const newWidth = rect.x + rect.width - mouseX;
        const newHeight = rect.y + rect.height - mouseY;
        if (newWidth > 10) {
          rect.x = mouseX;
          rect.width = newWidth;
        }
        if (newHeight > 10) {
          rect.y = mouseY;
          rect.height = newHeight;
        }
        break;
      case 'ne':
        rect.width = mouseX - rect.x;
        const newHeightNE = rect.y + rect.height - mouseY;
        if (newHeightNE > 10) {
          rect.y = mouseY;
          rect.height = newHeightNE;
        }
        break;
      case 'sw':
        const newWidthSW = rect.x + rect.width - mouseX;
        if (newWidthSW > 10) {
          rect.x = mouseX;
          rect.width = newWidthSW;
        }
        rect.height = mouseY - rect.y;
        break;
      case 'se':
        rect.width = mouseX - rect.x;
        rect.height = mouseY - rect.y;
        break;
    }

    // Ensure minimum size
    if (rect.width >= 10 && rect.height >= 10) {
      selectionRect = rect;
    }
  }

  function handleScroll(e) {
    // Update selection box position when scrolling
    if (selectionBox.style.display !== 'none') {
      updateSelectionBoxPosition();
    }
  }

  function updateSelectionBoxPosition() {
    const currentScrollTop = scrollContainer === window ? window.scrollY : scrollContainer.scrollTop;
    const currentScrollLeft = scrollContainer === window ? window.scrollX : scrollContainer.scrollLeft;

    // Convert container coordinates to viewport coordinates
    let viewportX, viewportY;
    if (scrollContainer === window) {
      viewportX = selectionRect.x - currentScrollLeft;
      viewportY = selectionRect.y - currentScrollTop;
    } else {
      // For nested containers, selectionRect is in container-relative coordinates
      // Need to add container's viewport position back
      const containerRect = scrollContainer.getBoundingClientRect();
      viewportX = (selectionRect.x - currentScrollLeft) + containerRect.left;
      viewportY = (selectionRect.y - currentScrollTop) + containerRect.top;

      // Clip the selection box to the container's visible area
      // This ensures it goes "under" any fixed headers above the container
      selectionBox.style.clipPath = `inset(${Math.max(0, containerRect.top - viewportY)}px 0px 0px 0px)`;
    }

    let width = selectionRect.width;
    let height = selectionRect.height;

    // Handle negative dimensions
    let x = viewportX;
    let y = viewportY;
    if (width < 0) {
      x += width;
      width = Math.abs(width);
    }
    if (height < 0) {
      y += height;
      height = Math.abs(height);
    }

    selectionBox.style.left = `${x}px`;
    selectionBox.style.top = `${y}px`;
    selectionBox.style.width = `${width}px`;
    selectionBox.style.height = `${height}px`;
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      cleanup();
    }
  }

  function updateSelectionBox() {
    updateSelectionBoxPosition();
  }

  function updateInfoText() {
    const info = document.getElementById('screenshot-info');
    if (info) {
      info.textContent = `${Math.round(selectionRect.width)} × ${Math.round(selectionRect.height)} px`;
    }
  }

  function checkAutoScroll(mouseX, mouseY) {
    autoScrollX = 0;
    autoScrollY = 0;

    // Check horizontal edges
    if (mouseX < EDGE_THRESHOLD) {
      autoScrollX = -SCROLL_SPEED;
    } else if (mouseX > window.innerWidth - EDGE_THRESHOLD) {
      autoScrollX = SCROLL_SPEED;
    }

    // Check vertical edges
    if (mouseY < EDGE_THRESHOLD) {
      autoScrollY = -SCROLL_SPEED;
    } else if (mouseY > window.innerHeight - EDGE_THRESHOLD) {
      autoScrollY = SCROLL_SPEED;
    }

    // Start auto-scrolling if needed
    if (autoScrollX !== 0 || autoScrollY !== 0) {
      if (!autoScrollInterval) {
        autoScrollInterval = setInterval(() => {
          if (scrollContainer === window) {
            window.scrollBy(autoScrollX, autoScrollY);
            maxScrollReached = Math.max(maxScrollReached, window.scrollY);
          } else {
            scrollContainer.scrollTop += autoScrollY;
            scrollContainer.scrollLeft += autoScrollX;
            maxScrollReached = Math.max(maxScrollReached, scrollContainer.scrollTop);
          }
        }, 16); // ~60fps
      }
    } else {
      stopAutoScroll();
    }
  }

  function stopAutoScroll() {
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      autoScrollInterval = null;
    }
  }

  async function captureScreenshot() {
    try {
      // Normalize the selection rect
      let x = selectionRect.x;
      let y = selectionRect.y;
      let width = selectionRect.width;
      let height = selectionRect.height;

      if (width < 0) {
        x += width;
        width = Math.abs(width);
      }
      if (height < 0) {
        y += height;
        height = Math.abs(height);
      }

      const normalizedRect = { x, y, width, height };

      // Hide the overlay and selection UI temporarily
      overlay.style.display = 'none';
      selectionBox.style.display = 'none';
      controls.style.display = 'none';

      // Capture the screenshot by scrolling through the selected area
      await captureViewportArea(normalizedRect);

    } catch (error) {
      console.error('Screenshot capture failed:', error);
      alert('Failed to capture screenshot: ' + error.message);
    } finally {
      cleanup();
    }
  }

  async function captureViewportArea(rect) {
    // Round rect coordinates to avoid sub-pixel issues
    const normalizedRect = {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    };
    rect = normalizedRect;

    // rect is now in page coordinates, so we can use it directly
    // The selection spans from rect.y to (rect.y + rect.height) in page coordinates
    const pageContentStart = rect.y;
    const pageContentEnd = rect.y + rect.height;
    const totalHeight = rect.height;

    const viewportHeight = window.innerHeight;

    const canvas = document.createElement('canvas');
    canvas.width = rect.width;
    canvas.height = totalHeight;
    const ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;

    // Scroll to the beginning of the selection area
    const startScroll = Math.max(0, rect.y);
    if (scrollContainer === window) {
      window.scrollTo(rect.x, startScroll);
    } else {
      scrollContainer.scrollTop = startScroll;
      scrollContainer.scrollLeft = rect.x;
    }

    await new Promise(resolve => setTimeout(resolve, 200));

    let nextPageYToCapture = pageContentStart;

    while (nextPageYToCapture < pageContentEnd) {
      // Get current scroll position
      const currentScroll = scrollContainer === window ? window.scrollY : scrollContainer.scrollTop;

      // Get container position if not window
      let containerTop = 0;
      if (scrollContainer !== window) {
        const containerRect = scrollContainer.getBoundingClientRect();
        // Round to avoid sub-pixel positioning issues
        containerTop = Math.round(containerRect.top);
      }

      // For nested containers, calculate relative to container's content coordinate system
      // The selection rect.y is in container coordinates (0 = top of scrollable content)
      // currentScroll is also in container coordinates

      // Calculate how much of the selection is visible in the container's viewport
      // containerTop to (containerTop + container's visible height) is what's visible
      const containerVisibleHeight = scrollContainer === window ? viewportHeight :
                                     Math.min(viewportHeight - containerTop, scrollContainer.clientHeight);

      // Calculate the visible portion of the selection
      const selectionEnd = rect.y + rect.height;
      const visibleEnd = Math.min(selectionEnd, currentScroll + containerVisibleHeight);
      const currentPageYEnd = visibleEnd;

      // Capture current viewport
      const dataUrl = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'captureVisible' },
          (response) => resolve(response.dataUrl)
        );
      });

      const img = await loadImage(dataUrl);

      // How much of this capture do we actually need?
      // Use nextPageYToCapture as the authoritative source - it represents where we want to start capturing
      const captureFrom = nextPageYToCapture;
      const captureTo = Math.min(currentPageYEnd, pageContentEnd);
      const chunkHeight = captureTo - captureFrom;

      if (chunkHeight > 0) {
        // Calculate where on the canvas this goes
        let canvasY = captureFrom - pageContentStart;

        // Calculate where in the captured viewport image this content is
        // captureFrom is in container coordinates, currentScroll is current scroll in container
        // The visible part of container starts at containerTop in the viewport
        // Content at container coordinate captureFrom appears at viewport Y = containerTop + (captureFrom - currentScroll)
        let sourceY = containerTop + (captureFrom - currentScroll);

        // Calculate X position in viewport
        let viewportX;
        if (scrollContainer === window) {
          viewportX = rect.x - window.scrollX;
        } else {
          // For nested containers, rect.x is container-relative
          // Need to add container's left position to get viewport X
          const containerRect = scrollContainer.getBoundingClientRect();
          const containerLeft = containerRect.left;
          viewportX = (rect.x - scrollContainer.scrollLeft) + containerLeft;
        }

        // Draw this chunk onto the canvas
        ctx.drawImage(
          img,
          viewportX * dpr, sourceY * dpr, rect.width * dpr, chunkHeight * dpr,
          0, canvasY, rect.width, chunkHeight
        );

        // Round nextPageYToCapture to avoid fractional canvas positions in subsequent chunks
        nextPageYToCapture = Math.round(captureTo);
      }

      // Scroll down for next chunk if needed
      if (nextPageYToCapture < pageContentEnd) {
        // Scroll to show the next portion of content
        const targetScroll = nextPageYToCapture;

        if (scrollContainer === window) {
          window.scrollTo(rect.x, targetScroll);
        } else {
          scrollContainer.scrollTop = targetScroll;
          scrollContainer.scrollLeft = rect.x;
        }

        await new Promise(resolve => setTimeout(resolve, 200));

        // Safety check: if we can't scroll anymore and haven't captured everything, we're stuck
        const newScroll = scrollContainer === window ? window.scrollY : scrollContainer.scrollTop;
        if (newScroll === currentScroll && nextPageYToCapture < pageContentEnd) {
          break;
        }
      }
    }

    // Capture complete

    // Convert canvas to blob and download
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `screenshot-${timestamp}.png`;

      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();

      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
  }

  function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  function cleanup() {
    stopAutoScroll();

    if (overlay) overlay.remove();
    if (selectionBox) selectionBox.remove();
    if (controls) controls.remove();

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('scroll', handleScroll, true);

    window.screenshotExtensionInjected = false;
  }

  // Start the extension
  init();
})();
