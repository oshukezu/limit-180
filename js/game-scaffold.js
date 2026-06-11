// Limit 180 — 視覺輔助元件繪製模組 (Scaffold Module)
(function() {
  const Scaffold = {
    // --- 心算視覺輔助繪製 ---
    renderScaffold(question) {
      const box = document.getElementById('scaffold-box');
      const container = document.getElementById('scaffold-canvas-container');
      if (!box || !container) return;
      container.innerHTML = '';

      // 隱藏輔助圖形的條件：
      // 1. Mission 是 5 (魔王)、7 (魔王) 或是 10 (終極挑戰)
      // 2. Combo 達 5 以上
      // 3. 非比大小題型，或無輔助數據
      const isBoss = [5, 7, 10].includes(this.gameState.currentMission);
      if (isBoss || this.gameState.combo >= 5 || question.type !== 'compare' || !question.scaffoldData) {
        box.style.display = 'none';
        return;
      }

      box.style.display = 'block';

      const data = question.scaffoldData;
      const wrapper = document.createElement('div');
      wrapper.className = "flex w-full justify-around items-center h-full";

      const leftDiv = document.createElement('div');
      leftDiv.className = "flex flex-col items-center gap-1";
      leftDiv.innerHTML = `<span class="text-[9px] text-cyan-400 font-pixel">左邊</span>`;
      leftDiv.appendChild(this.createScaffoldGraphic(data.leftType, data.leftVal, data.fracDetails));

      const vsSpan = document.createElement('span');
      vsSpan.className = "text-xs font-pixel text-pink-500 animate-pulse";
      vsSpan.textContent = "VS";

      const rightDiv = document.createElement('div');
      rightDiv.className = "flex flex-col items-center gap-1";
      rightDiv.innerHTML = `<span class="text-[9px] text-pink-400 font-pixel">右邊</span>`;
      rightDiv.appendChild(this.createScaffoldGraphic(data.rightType, data.rightVal, data.leftType === 'fraction' ? null : data.fracDetails));

      wrapper.appendChild(leftDiv);
      wrapper.appendChild(vsSpan);
      wrapper.appendChild(rightDiv);
      
      container.appendChild(wrapper);
    },

    createScaffoldGraphic(type, value, fracDetails) {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", "70");
      svg.setAttribute("height", "70");
      svg.setAttribute("viewBox", "0 0 100 100");
      svg.style.border = "1px solid #1f2937";
      svg.style.backgroundColor = "#020205";

      if (type === 'fraction' && fracDetails) {
        const match = fracDetails.raw.match(/(\d+)\/(\d+)/);
        if (match) {
          const num = parseInt(match[1]);
          const den = parseInt(match[2]);
          const cx = 50, cy = 50, r = 35;
          const bgCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          bgCircle.setAttribute("cx", cx);
          bgCircle.setAttribute("cy", cy);
          bgCircle.setAttribute("r", r);
          bgCircle.setAttribute("fill", "#111827");
          bgCircle.setAttribute("stroke", "#374151");
          bgCircle.setAttribute("stroke-width", "2");
          svg.appendChild(bgCircle);

          let accumAngle = -Math.PI / 2;
          const sliceAngle = (2 * Math.PI) / den;

          for (let i = 0; i < den; i++) {
            const angleStart = accumAngle;
            const angleEnd = accumAngle + sliceAngle;
            accumAngle = angleEnd;

            const x1 = cx + r * Math.cos(angleStart);
            const y1 = cy + r * Math.sin(angleStart);
            const x2 = cx + r * Math.cos(angleEnd);
            const y2 = cy + r * Math.sin(angleEnd);

            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            
            const isFilled = i < num;
            const fillCol = isFilled ? "rgba(0, 240, 255, 0.6)" : "transparent";
            const strokeCol = "#374151";

            const largeArc = sliceAngle > Math.PI ? 1 : 0;
            const dStr = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
            path.setAttribute("d", dStr);
            path.setAttribute("fill", fillCol);
            path.setAttribute("stroke", strokeCol);
            path.setAttribute("stroke-width", "1");
            svg.appendChild(path);
          }
        }
      } else if (type === 'decimal' || type === 'fraction') {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        const boxSize = 6;
        const spacing = 1;
        const startX = 15;
        const startY = 15;
        const totalToFill = Math.round(value * 100);

        for (let r = 0; r < 10; r++) {
          for (let c = 0; c < 10; c++) {
            const idx = r * 10 + c;
            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("x", startX + c * (boxSize + spacing));
            rect.setAttribute("y", startY + r * (boxSize + spacing));
            rect.setAttribute("width", boxSize);
            rect.setAttribute("height", boxSize);
            const isFilled = idx < totalToFill;
            rect.setAttribute("fill", isFilled ? "rgba(234, 179, 8, 0.7)" : "#111827");
            rect.setAttribute("stroke", "#374151");
            rect.setAttribute("stroke-width", "0.5");
            g.appendChild(rect);
          }
        }
        svg.appendChild(g);
      } else {
        const barWidth = 20;
        const barHeight = 70;
        const rx = 15;
        const ry = 15;

        const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        bgRect.setAttribute("x", "40");
        bgRect.setAttribute("y", ry);
        bgRect.setAttribute("width", barWidth);
        bgRect.setAttribute("height", barHeight);
        bgRect.setAttribute("fill", "#111827");
        bgRect.setAttribute("stroke", "#374151");
        bgRect.setAttribute("stroke-width", "2");
        svg.appendChild(bgRect);

        const filledHeight = barHeight * value;
        const fillRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        fillRect.setAttribute("x", "40");
        fillRect.setAttribute("y", ry + (barHeight - filledHeight));
        fillRect.setAttribute("width", barWidth);
        fillRect.setAttribute("height", filledHeight);
        fillRect.setAttribute("fill", "rgba(236, 72, 153, 0.7)");
        svg.appendChild(fillRect);

        for (let i = 1; i < 4; i++) {
          const tickY = ry + (barHeight * i / 4);
          const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute("x1", "36");
          line.setAttribute("y1", tickY);
          line.setAttribute("x2", "64");
          line.setAttribute("y2", tickY);
          line.setAttribute("stroke", "#4b5563");
          line.setAttribute("stroke-width", "1");
          svg.appendChild(line);
        }
      }

      return svg;
    }
  };

  // Mixin 到全域的 MathSprintGame 物件，維持無縫相容性
  window.MathSprintGame = window.MathSprintGame || {};
  Object.assign(window.MathSprintGame, Scaffold);
})();
