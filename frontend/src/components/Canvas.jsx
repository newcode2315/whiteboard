import React, { useEffect, useLayoutEffect, useState } from "react";
import rough from "roughjs";
import imgSrc from "/grid.png"; // Load directly from public

const roughGenerator = rough.generator();

const Canvas = ({
  canvasRef,
  ctx,
  color,
  setElements,
  elements,
  tool,
  socket,
  user,
  brushWidth,
}) => {
  if (user?.presenter) {
    return (
      <PresenterCanvas
        canvasRef={canvasRef}
        ctx={ctx}
        color={color}
        setElements={setElements}
        elements={elements}
        tool={tool}
        socket={socket}
        brushWidth={brushWidth}
      />
    );
  } else {
    return <ViewerCanvas socket={socket} />;
  }
};

const PresenterCanvas = ({
  canvasRef,
  ctx,
  color,
  setElements,
  elements,
  tool,
  socket,
  brushWidth,
}) => {
  const [isDrawing, setIsDrawing] = useState(false);

  // Initialize canvas size once on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set internal resolution double the style size for high DPI screen sharpness
    const displayWidth = 1000;
    const displayHeight = 500;
    canvas.width = displayWidth * 2;
    canvas.height = displayHeight * 2;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    const context = canvas.getContext("2d");
    context.scale(2, 2);
    context.lineCap = "round";
    context.lineJoin = "round";
    ctx.current = context;
  }, [canvasRef, ctx]);

  // Redraw all elements when elements list changes
  useLayoutEffect(() => {
    if (!canvasRef.current || !ctx.current) return;
    const roughGen = rough.canvas(canvasRef.current);

    // Clear canvas before redrawing
    ctx.current.clearRect(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );

    elements.forEach((element) => {
      if (element.type === "pencil" || element.type === "eraser") {
        roughGen.linearPath(element.path, {
          stroke: element.stroke,
          strokeWidth: element.strokeWidth || 2,
          roughness: 0,
        });
      } else if (element.type === "line") {
        roughGen.draw(
          roughGenerator.line(
            element.offsetX,
            element.offsetY,
            element.width,
            element.height,
            {
              stroke: element.stroke,
              strokeWidth: element.strokeWidth || 2,
              roughness: 0,
            }
          )
        );
      } else if (element.type === "rect") {
        roughGen.draw(
          roughGenerator.rectangle(
            element.offsetX,
            element.offsetY,
            element.width,
            element.height,
            {
              stroke: element.stroke,
              strokeWidth: element.strokeWidth || 2,
              roughness: 0,
            }
          )
        );
      }
    });

    const canvasImage = canvasRef.current.toDataURL();
    socket.emit("whiteBoardData", canvasImage);
  }, [elements, canvasRef, ctx, socket]);

  const handleMouseDown = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    const strokeColor = tool === "eraser" ? "#ffffff" : color;
    const currentWidth = tool === "eraser" ? brushWidth * 1.8 : brushWidth; // Make eraser slightly wider

    if (tool === "pencil" || tool === "eraser") {
      setElements((prevElements) => [
        ...prevElements,
        {
          type: tool,
          offsetX,
          offsetY,
          path: [[offsetX, offsetY]],
          stroke: strokeColor,
          strokeWidth: currentWidth,
        },
      ]);
    } else if (tool === "line") {
      setElements((prevElements) => [
        ...prevElements,
        {
          type: "line",
          offsetX,
          offsetY,
          width: offsetX,
          height: offsetY,
          stroke: strokeColor,
          strokeWidth: currentWidth,
        },
      ]);
    } else if (tool === "rect") {
      setElements((prevElements) => [
        ...prevElements,
        {
          type: "rect",
          offsetX,
          offsetY,
          width: 0,
          height: 0,
          stroke: strokeColor,
          strokeWidth: currentWidth,
        },
      ]);
    }

    setIsDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    if (tool === "pencil" || tool === "eraser") {
      setElements((prevElements) => {
        const newElements = [...prevElements];
        const lastIndex = newElements.length - 1;
        if (lastIndex >= 0) {
          const lastElement = newElements[lastIndex];
          newElements[lastIndex] = {
            ...lastElement,
            path: [...lastElement.path, [offsetX, offsetY]],
          };
        }
        return newElements;
      });
    } else if (tool === "line") {
      setElements((prevElements) => {
        const newElements = [...prevElements];
        const lastIndex = newElements.length - 1;
        if (lastIndex >= 0) {
          const lastElement = newElements[lastIndex];
          newElements[lastIndex] = {
            ...lastElement,
            width: offsetX,
            height: offsetY,
          };
        }
        return newElements;
      });
    } else if (tool === "rect") {
      setElements((prevElements) => {
        const newElements = [...prevElements];
        const lastIndex = newElements.length - 1;
        if (lastIndex >= 0) {
          const lastElement = newElements[lastIndex];
          const startX = lastElement.offsetX;
          const startY = lastElement.offsetY;
          newElements[lastIndex] = {
            ...lastElement,
            width: offsetX - startX,
            height: offsetY - startY,
          };
        }
        return newElements;
      });
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  return (
    <div
      className="canvas-wrapper mx-auto"
      style={{ backgroundImage: `url(${imgSrc})` }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <canvas ref={canvasRef} className="canvas-element" />
    </div>
  );
};

const ViewerCanvas = ({ socket }) => {
  const [img, setImg] = useState(null);

  useEffect(() => {
    const handleResponse = (data) => {
      setImg(data.imgURL);
    };

    socket.on("whiteBoardDataResponse", handleResponse);

    return () => {
      socket.off("whiteBoardDataResponse", handleResponse);
    };
  }, [socket]);

  return (
    <div
      className="canvas-wrapper mx-auto"
      style={{ backgroundImage: `url(${imgSrc})` }}
    >
      {img ? (
        <img
          src={img}
          alt="Shared Whiteboard"
          className="canvas-element"
          style={{
            width: "1000px",
            height: "500px",
            objectFit: "contain",
            background: "transparent",
          }}
        />
      ) : (
        <div className="text-center text-muted p-5">
          <p className="h5 mb-2">Waiting for presenter to start drawing...</p>
          <div className="spinner-border text-primary mt-3" role="status" style={{ width: "2rem", height: "2rem" }}>
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Canvas;
