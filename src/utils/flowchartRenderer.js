const DEFAULT_CANVAS_WIDTH = 2200;
const DEFAULT_CANVAS_HEIGHT = 1600;
const DEFAULT_MODULE_HEIGHT = 520;
const DEFAULT_MARGIN = 40;
const SOURCE_BLOCK_WIDTH = 400;  // 增加源頭最小寬度
const SOURCE_BLOCK_HEIGHT = 160;
const GAP_SOURCE_TO_MAIN = 30;
const VALVE_SPACING = 95;
const VALVE_SIZE = 60;
const VERTICAL_LINE_LENGTH = 600;  // Match test-flowchart-render.html
const BRANCH_SPACING = 230;  // Match test-flowchart-render.html
const BOX_WIDTH = 220;  // Match test-flowchart-render.html
const BOX_HEIGHT = 100;  // Match test-flowchart-render.html
const CHILLER_BOX_WIDTH = 300;  // Further reduced for equipment cards

const FONT_PRIMARY = '24px "Microsoft JhengHei", "微軟正黑體", Arial';
const FONT_SECONDARY = '22px "Microsoft JhengHei", "微軟正黑體", Arial';
const FONT_SMALL = '20px "Microsoft JhengHei", "微軟正黑體", Arial';
const FONT_SMALL_ROTATED = '16px "Microsoft JhengHei", "微軟正黑體", Arial';
const FONT_VALVE = '13px "Microsoft JhengHei", "微軟正黑體", Arial';  // 水平閥件文字使用更小的字體

function drawTextBlock(ctx, lines, x, y, options = {}) {
  if (!lines || lines.length === 0) return;
  const {
    font = FONT_PRIMARY,
    color = '#1f1f1f',
    lineHeight = 28,  // Match test-flowchart-render.html
    maxWidth = null,
    align = 'left'
  } = options;

  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = align;
  lines.forEach((line, index) => {
    const text = line ?? '';
    if (!text) {
      return;
    }
    const drawY = y + index * lineHeight;
    if (maxWidth && ctx.measureText(text).width > maxWidth) {
      wrapText(ctx, text, x, drawY, maxWidth, lineHeight);
    } else {
      ctx.fillText(text, x, drawY);
    }
  });
  ctx.textAlign = 'left';  // Reset to default
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split('');
  let line = '';
  let currentY = y;

  words.forEach((char) => {
    const testLine = line + char;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line !== '') {
      ctx.fillText(line, x, currentY);
      line = char;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  });
  if (line !== '') {
    ctx.fillText(line, x, currentY);
  }
}

/**
 * 計算設備卡片需要的實際高度（考慮斷行）
 * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
 * @param {Array} lines - 設備資訊行數組
 * @param {number} boxWidth - 卡片寬度
 * @param {number} lineHeight - 行高
 * @param {string} font - 字體
 * @param {number} minHeight - 最小高度
 * @returns {number} 實際需要的卡片高度
 */
function calculateEquipmentBoxHeight(ctx, lines, boxWidth, lineHeight, font, minHeight) {
  if (!lines || lines.length === 0) return minHeight;
  
  ctx.font = font;
  const textPadding = 30; // 左右各15px的padding
  const maxTextWidth = boxWidth - textPadding;
  let totalHeight = 0;
  
  lines.forEach((line) => {
    const text = line ?? '';
    if (!text) return;
    
    const textWidth = ctx.measureText(text).width;
    if (textWidth > maxTextWidth) {
      // 需要斷行，計算需要多少行
      const words = text.split('');
      let currentLine = '';
      let lineCount = 0;
      
      words.forEach((char) => {
        const testLine = currentLine + char;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxTextWidth && currentLine !== '') {
          lineCount++;
          currentLine = char;
        } else {
          currentLine = testLine;
        }
      });
      if (currentLine !== '') {
        lineCount++;
      }
      totalHeight += lineCount * lineHeight;
    } else {
      // 不需要斷行
      totalHeight += lineHeight;
    }
  });
  
  const verticalPadding = 20; // 上下各10px的padding
  return Math.max(minHeight, totalHeight + verticalPadding);
}

/**
 * 根據管線類型繪製線條（支持單套管、雙套管、軟管）
 * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
 * @param {number} x1 - 起點 X 座標
 * @param {number} y1 - 起點 Y 座標
 * @param {number} x2 - 終點 X 座標
 * @param {number} y2 - 終點 Y 座標
 * @param {string} pipelineType - 管線類型：'單套管'、'雙套管'、'軟管'
 * @param {boolean} isVertical - 是否為垂直線（用於波浪線）
 */
function drawLineByType(ctx, x1, y1, x2, y2, pipelineType = '單套管', isVertical = false) {
  if (pipelineType === '雙套管') {
    // 雙套管：雙線（兩條平行線，偏移 ±3）
    const offset = 3;
    if (isVertical) {
      // 垂直線：使用 X 軸偏移
      ctx.beginPath();
      ctx.moveTo(x1 - offset, y1);
      ctx.lineTo(x1 - offset, y2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x1 + offset, y1);
      ctx.lineTo(x1 + offset, y2);
      ctx.stroke();
    } else {
      // 水平線：使用 Y 軸偏移
      ctx.beginPath();
      ctx.moveTo(x1, y1 - offset);
      ctx.lineTo(x2, y2 - offset);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x1, y1 + offset);
      ctx.lineTo(x2, y2 + offset);
      ctx.stroke();
    }
  } else if (pipelineType === '軟管') {
    // 軟管：波浪線
    drawWavyLine(ctx, x1, y1, x2, y2, isVertical);
  } else {
    // 單套管：單線（默認）
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

/**
 * 繪製波浪線（軟管）
 * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
 * @param {number} x1 - 起點 X 座標
 * @param {number} y1 - 起點 Y 座標
 * @param {number} x2 - 終點 X 座標
 * @param {number} y2 - 終點 Y 座標
 * @param {boolean} isVertical - 是否為垂直線
 */
function drawWavyLine(ctx, x1, y1, x2, y2, isVertical) {
  const waveAmplitude = 8; // 波浪幅度
  const waveFrequency = 20; // 波浪頻率（每20px一個波）
  
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  
  if (isVertical) {
    // 垂直波浪
    const distance = Math.abs(y2 - y1);
    const waves = Math.floor(distance / waveFrequency);
    const direction = y2 > y1 ? 1 : -1;
    
    for (let i = 0; i < waves; i++) {
      const y1_wave = y1 + direction * (i * 2 + 1) * waveFrequency / 2;
      const y2_wave = y1 + direction * (i + 1) * waveFrequency;
      const xOffset = (i % 2 === 0) ? waveAmplitude : -waveAmplitude;
      ctx.quadraticCurveTo(x1 + xOffset, y1_wave, x1, y2_wave);
    }
    // 連接到終點
    if (distance % waveFrequency !== 0) {
      ctx.lineTo(x2, y2);
    }
  } else {
    // 水平波浪
    const distance = Math.abs(x2 - x1);
    const waves = Math.floor(distance / waveFrequency);
    const direction = x2 > x1 ? 1 : -1;
    
    for (let i = 0; i < waves; i++) {
      const x1_wave = x1 + direction * (i * 2 + 1) * waveFrequency / 2;
      const x2_wave = x1 + direction * (i + 1) * waveFrequency;
      const yOffset = (i % 2 === 0) ? waveAmplitude : -waveAmplitude;
      ctx.quadraticCurveTo(x1_wave, y1 + yOffset, x2_wave, y1);
    }
    // 連接到終點
    if (distance % waveFrequency !== 0) {
      ctx.lineTo(x2, y2);
    }
  }
  
  ctx.stroke();
}

function drawValveSymbol(ctx, centerX, centerY, size, label, verticalLabel, isVertical = false, valveInfo = {}) {
  const half = size / 2;
  const height = isVertical ? size * 0.9 : size * 0.7;  // Horizontal valve has lower triangle height
  
  if (isVertical) {
    // Vertical valve (rotated 90 degrees) - narrower width
    const narrowWidth = half * 0.6;  // Make it narrower
    
    // Top triangle (pointing down)
    ctx.beginPath();
    ctx.moveTo(centerX - narrowWidth, centerY - height / 2);
    ctx.lineTo(centerX, centerY);
    ctx.lineTo(centerX + narrowWidth, centerY - height / 2);
    ctx.closePath();
    ctx.stroke();

    // Bottom triangle (pointing up)
    ctx.beginPath();
    ctx.moveTo(centerX - narrowWidth, centerY + height / 2);
    ctx.lineTo(centerX, centerY);
    ctx.lineTo(centerX + narrowWidth, centerY + height / 2);
    ctx.closePath();
    ctx.stroke();

    // Draw X inside the valve (cross lines)
    ctx.beginPath();
    ctx.moveTo(centerX - narrowWidth + 4, centerY - height / 2 + 5);
    ctx.lineTo(centerX + narrowWidth - 4, centerY + height / 2 - 5);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX + narrowWidth - 4, centerY - height / 2 + 5);
    ctx.lineTo(centerX - narrowWidth + 4, centerY + height / 2 - 5);
    ctx.stroke();
    
    // Draw horizontal T shape on the left side of vertical valve
    const tWidth = 15;
    const tHeight = narrowWidth * 2;
    const tLeftX = centerX - narrowWidth - tWidth - 5;
    
    // Vertical bar of T (for horizontal T, this is the main line)
    ctx.beginPath();
    ctx.moveTo(tLeftX + 19, centerY - tHeight / 2 + 3);
    ctx.lineTo(tLeftX + 19, centerY + tHeight / 2 - 3);
    ctx.stroke();
    
    // Horizontal bar of T (perpendicular line)
    ctx.beginPath();
    ctx.moveTo(tLeftX + 19, centerY);
    ctx.lineTo(tLeftX + tWidth + 22, centerY);
    ctx.stroke();
  } else {
    // Horizontal valve (original orientation)
    // Left triangle
    ctx.beginPath();
    ctx.moveTo(centerX - half, centerY - height / 2);
    ctx.lineTo(centerX, centerY);
    ctx.lineTo(centerX - half, centerY + height / 2);
    ctx.closePath();
    ctx.stroke();

    // Right triangle
    ctx.beginPath();
    ctx.moveTo(centerX + half, centerY - height / 2);
    ctx.lineTo(centerX, centerY);
    ctx.lineTo(centerX + half, centerY + height / 2);
    ctx.closePath();
    ctx.stroke();

    // Draw X inside the valve
    ctx.beginPath();
    ctx.moveTo(centerX - half + 5, centerY - height / 2 + 5);
    ctx.lineTo(centerX + half - 5, centerY + height / 2 - 5);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX + half - 5, centerY - height / 2 + 5);
    ctx.lineTo(centerX - half + 5, centerY + height / 2 - 5);
    ctx.stroke();

    // Draw T shape on top of horizontal valve (similar to check valve)
    const tWidth = size * 0.7;
    const tHeight = 15;
    const tTopY = centerY - height / 2 - tHeight;
    
    // Horizontal bar of T (the top horizontal line)
    ctx.beginPath();
    ctx.moveTo(centerX - tWidth / 2, tTopY + 13);
    ctx.lineTo(centerX + tWidth / 2, tTopY + 13);
    ctx.stroke();
    
    // Vertical bar of T (the vertical line from top down to horizontal bar)
    // Starts from above (tTopY + 32) and connects to horizontal bar (tTopY + tHeight + 1)
    ctx.beginPath();
    ctx.moveTo(centerX, tTopY + 32);
    ctx.lineTo(centerX, tTopY + tHeight + 1);
    ctx.stroke();

    // 上方文字：{閥件尺寸}{閥件接頭}
    const valveSize = valveInfo.valveSize || '';
    const valveConnector = valveInfo.valveConnector || '';
    const topLineParts = [];
    if (valveSize) topLineParts.push(String(valveSize).trim());
    if (valveConnector) topLineParts.push(String(valveConnector).trim());
    if (topLineParts.length > 0) {
      ctx.font = FONT_SMALL_ROTATED;  // 使用更小的字體
      ctx.fillStyle = '#1f1f1f';
      ctx.textAlign = 'center';
      ctx.fillText(topLineParts.join(' '), centerX, centerY - height / 2 - 8);
      ctx.textAlign = 'left';
    }
    
    // 下方文字：{閥件種類}（只有當不為"NA"時才顯示）
    const valveType = valveInfo.valveType || '';
    if (valveType && valveType !== 'NA') {
      ctx.font = FONT_VALVE;  // 使用更小的字體
      ctx.fillStyle = '#1f1f1f';
      ctx.textAlign = 'center';
      ctx.fillText(String(valveType).trim(), centerX, centerY + height / 2 + 18);
      ctx.textAlign = 'left';
    }
  }
  
  // Vertical label will be drawn by caller
  return { centerX, centerY, height, verticalLabel };
}

function drawCheckValve(ctx, centerX, centerY, size, label, valveInfo = {}) {
  const width = size;
  const height = size * 0.7;  // Lower triangle height for horizontal valve
  
  // Draw butterfly valve (two triangles facing each other)
  // Left triangle (pointing right)
  ctx.beginPath();
  ctx.moveTo(centerX - width / 2, centerY - height / 2);
  ctx.lineTo(centerX, centerY);
  ctx.lineTo(centerX - width / 2, centerY + height / 2);
  ctx.closePath();
  ctx.stroke();
  
  // Right triangle (pointing left)
  ctx.beginPath();
  ctx.moveTo(centerX + width / 2, centerY - height / 2);
  ctx.lineTo(centerX, centerY);
  ctx.lineTo(centerX + width / 2, centerY + height / 2);
  ctx.closePath();
  ctx.stroke();
  
  // Draw X inside the butterfly valve
  ctx.beginPath();
  ctx.moveTo(centerX - width / 2 + 5, centerY - height / 2 + 5);
  ctx.lineTo(centerX + width / 2 - 5, centerY + height / 2 - 5);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(centerX + width / 2 - 5, centerY - height / 2 + 5);
  ctx.lineTo(centerX - width / 2 + 5, centerY + height / 2 - 5);
  ctx.stroke();
  
  // Vertical line on the right side
  ctx.beginPath();
  ctx.moveTo(centerX + width / 2, centerY - height / 2 - 2);
  ctx.lineTo(centerX + width / 2, centerY + height / 2 + 2);
  ctx.stroke();
  
  // Draw T shape on top of butterfly valve
  const tWidth = width * 0.7;
  const tHeight = 15;
  const tTopY = centerY - height / 2 - tHeight;
  
  // Horizontal bar of T
  ctx.beginPath();
  ctx.moveTo(centerX - tWidth / 2, tTopY + 13);
  ctx.lineTo(centerX + tWidth / 2, tTopY + 13);
  ctx.stroke();
  
  // Vertical bar of T
  ctx.beginPath();
  ctx.moveTo(centerX, tTopY + 33);
  ctx.lineTo(centerX, tTopY + tHeight + 1);
  ctx.stroke();

  // 上方文字：{閥件尺寸}{閥件接頭}（與設備閥件格式相同）
  const valveSize = valveInfo.valveSize || '';
  const valveConnector = valveInfo.valveConnector || '';
  const topLineParts = [];
  if (valveSize) topLineParts.push(String(valveSize).trim());
  if (valveConnector) topLineParts.push(String(valveConnector).trim());
  if (topLineParts.length > 0) {
    ctx.font = FONT_SMALL_ROTATED;  // 與設備閥件相同
    ctx.fillStyle = '#1f1f1f';
    ctx.textAlign = 'center';
    ctx.fillText(topLineParts.join(' '), centerX, centerY - height / 2 - 8);
    ctx.textAlign = 'left';
  }
  
  // 下方文字：{閥件種類}（只有當不為"NA"時才顯示，與設備閥件格式相同）
  const valveType = valveInfo.valveType || '';
  if (valveType && valveType !== 'NA') {
    ctx.font = FONT_VALVE;  // 與設備閥件相同
    ctx.fillStyle = '#1f1f1f';
    ctx.textAlign = 'center';
    ctx.fillText(String(valveType).trim(), centerX, centerY + height / 2 + 18);
    ctx.textAlign = 'left';
  }
}

function buildSourceLines(source = {}, settings = {}) {
  const lines = [];

  // 根據圖片格式，第一行：{氣體別}{管線類別}{雙套管尺寸}{保溫加熱}
  // 例如：XCDA 保溫加熱
  // 管線類別顯示規則：單套管不顯示；雙套管顯示"雙"；軟管顯示"軟"
  const firstLineParts = [];
  if (source.gasType) firstLineParts.push(String(source.gasType).trim());
  
  // 處理管線類別顯示
  if (source.pipelineType) {
    const pipelineType = String(source.pipelineType).trim();
    if (pipelineType === '雙套管') {
      firstLineParts.push('雙');
    } else if (pipelineType === '軟管') {
      firstLineParts.push('軟');
    }
    // 單套管時不顯示，所以不加入
  }
  
  if (source.doubleSleeveSize) firstLineParts.push(String(source.doubleSleeveSize).trim());
  if (source.heatInsulation) firstLineParts.push('保溫加熱');
  if (firstLineParts.length > 0) {
    lines.push(firstLineParts.join(' '));
  }

  // 第二行：{閥件編號}
  // 例如：XCDA-MPR-B-R-20
  if (source.valveNumber) {
    lines.push(String(source.valveNumber).trim());
  }

  // 第三行：{尺寸}{接頭規格}
  // 例如：20A
  // 注意：WELD 不顯示
  const thirdLineParts = [];
  if (source.sourceSize) thirdLineParts.push(String(source.sourceSize).trim());
  if (source.connectorSpec && source.connectorSpec !== 'WELD') {
    thirdLineParts.push(String(source.connectorSpec).trim());
  }
  if (thirdLineParts.length > 0) {
    lines.push(thirdLineParts.join(' '));
  }

  // 第四行：{位置資訊}
  // 例如：(3/R.5)
  if (source.locationInfo) {
    lines.push(String(source.locationInfo).trim());
  }

  return lines;
}

function buildSourceCardBoxLines(source = {}) {
  const lines = [];
  const title = source.title ? String(source.title).trim() : '源頭資訊';
  if (title) {
    lines.push(title);
  }

  const pipelineParts = [];
  if (source.pipelineType) pipelineParts.push(String(source.pipelineType).trim());
  if (source.gasType) pipelineParts.push(String(source.gasType).trim());
  if (source.doubleSleeveSize) pipelineParts.push(String(source.doubleSleeveSize).trim());
  if (source.heatInsulation) pipelineParts.push('保溫加熱');
  if (pipelineParts.length) {
    lines.push(pipelineParts.join(' / '));
  }

  if (source.valveNumber) {
    lines.push(String(source.valveNumber).trim());
  }

  const sizeConnectorParts = [];
  if (source.sourceSize) sizeConnectorParts.push(String(source.sourceSize).trim());
  if (source.connectorSpec) sizeConnectorParts.push(String(source.connectorSpec).trim());
  if (sizeConnectorParts.length) {
    lines.push(sizeConnectorParts.join(' / '));
  }

  if (source.locationInfo) {
    lines.push(String(source.locationInfo).trim());
  }

  return lines.filter((line) => line && line.length);
}

function buildBranchSourceCardBoxLines(branchSource = {}, options = {}) {
  const { index = 0 } = options;
  const lines = [];
  const defaultTitle = index === 0 ? '分支源頭資訊' : `分支源頭資訊 ${index + 1}`;
  const title = branchSource.title ? String(branchSource.title).trim() : defaultTitle;
  if (title) {
    lines.push(title);
  }

  const pipelineParts = [];
  if (branchSource.pipelineType) pipelineParts.push(String(branchSource.pipelineType).trim());
  if (branchSource.gasType) pipelineParts.push(String(branchSource.gasType).trim());
  if (branchSource.doubleSleeveSize) pipelineParts.push(String(branchSource.doubleSleeveSize).trim());
  if (branchSource.heatInsulation) pipelineParts.push('保溫加熱');
  if (pipelineParts.length) {
    lines.push(pipelineParts.join(' / '));
  }

  if (branchSource.valveNumber) {
    lines.push(String(branchSource.valveNumber).trim());
  }

  const sizeConnectorParts = [];
  if (branchSource.sourceSize) sizeConnectorParts.push(String(branchSource.sourceSize).trim());
  if (branchSource.connectorSpec) sizeConnectorParts.push(String(branchSource.connectorSpec).trim());
  if (sizeConnectorParts.length) {
    lines.push(sizeConnectorParts.join(' / '));
  }

  if (branchSource.locationInfo) {
    lines.push(String(branchSource.locationInfo).trim());
  }

  return lines.filter((line) => line && line.length);
}

function buildPipelineLabel(pipeline = {}, floor = {}) {
  const text = [];
  if (pipeline.length) text.push(`${pipeline.length}M`);
  if (pipeline.material) text.push(pipeline.material);
  // if (floor.sourceFloor || floor.equipmentFloor) {
  //   text.push([floor.sourceFloor, floor.equipmentFloor].filter(Boolean).join(' → '));
  // }
  return text.join(' ');
}

function buildEquipmentLines(equipment = {}, panel = {}, options = {}) {
  const lines = [];
  const { index, sourceGasType } = options;
  
  // 根據圖片格式，設備卡片顯示：
  // 第一行：{氣體別} - 內容同起點資訊氣體別（如果設備沒有氣體別，使用源頭資訊的氣體別）
  const gasType = equipment.gasType || sourceGasType || '';
  if (gasType) {
    lines.push(String(gasType).trim());
  }
  
  // 第二行：{尺寸}{接頭規格} - 例如：1/2" F-VCR
  // 注意：WELD 不顯示
  const secondLineParts = [];
  if (equipment.size) {
    secondLineParts.push(String(equipment.size).trim());
  }
  if (equipment.connector && equipment.connector !== 'WELD') {
    secondLineParts.push(String(equipment.connector).trim());
  }
  if (secondLineParts.length > 0) {
    lines.push(secondLineParts.join(' '));
  }
  
  // 第三行：{設備接點名稱} - 例如：Chiller DI SOLVER
  // 設備接點名稱需要斷行處理（根據寬度自動換行）
  if (equipment.connectionName) {
    const connectionName = String(equipment.connectionName).trim();
    // 這裡先返回原始文本，實際斷行會在繪製時根據 maxWidth 處理
    lines.push(connectionName);
  }
  
  return lines.filter(Boolean);
}

function drawEquipmentBranch(ctx, options) {
  const {
    branchIndex,
    mainLineY,
    branchStartX,
    boxLeft,
    boxWidth,
    boxHeight,
    branchSpacing,
    lines
  } = options;

  const branchY = branchIndex === 0 ? mainLineY : mainLineY + branchSpacing * branchIndex;

  ctx.beginPath();
  ctx.moveTo(branchStartX, branchIndex === 0 ? mainLineY : mainLineY);
  if (branchIndex > 0) {
    ctx.lineTo(branchStartX, branchY);
  }
  ctx.lineTo(boxLeft, branchY);
  ctx.stroke();

  const top = branchY - boxHeight / 2;
  ctx.strokeRect(boxLeft, top, boxWidth, boxHeight);

  drawTextBlock(ctx, lines, boxLeft + 20, top + 40, {
    font: FONT_SECONDARY,
    lineHeight: 30,
    maxWidth: boxWidth - 40
  });
}

/**
 * 从 moduleSet 提取并转换数据格式，使其符合渲染需求
 * @param {Object} moduleSet - 模組組對象
 * @param {Object} settings - 設定對象
 * @returns {Object} 转换后的数据对象
 */
function extractModuleSetData(moduleSet = {}, settings = {}) {
  // 提取源頭資訊
  const source = moduleSet.source || {};
  const sourceData = source.data || {};
  const sourceLines = buildSourceLines(sourceData, settings);

  // 提取管線資訊
  const pipeline = moduleSet.pipeline || {};
  const pipelineData = pipeline.data || {};
  const floor = moduleSet.floor || {};
  const floorData = floor.data || {};
  const pipelineLabel = buildPipelineLabel(pipelineData, floorData);

  // 提取分支數據
  const branches = [];

  // 主分支：從 panelEquipmentGroups 提取
  const panelEquipmentGroups = moduleSet.panelEquipmentGroups || [];
  const sourceGasType = sourceData.gasType || ''; // 提取源頭資訊的氣體別
  panelEquipmentGroups.forEach((group, index) => {
    const panel = group.panel || {};
    const panelData = panel.data || {};
    const equipment = group.equipment || {};
    const equipmentData = equipment.data || {};

    // 構建 chillerLines（panel + equipment 資訊）
    const chillerLines = buildEquipmentLines(equipmentData, panelData, { index, sourceGasType });

    // 構建 SWG label（從 valveCards 或 panel 資訊中提取）
    // 這裡需要根據實際數據結構調整
    let swgLabel = '';
    if (moduleSet.valveCards && moduleSet.valveCards.length > 0) {
      // 如果有閥件卡片，從中提取
      const valveCard = moduleSet.valveCards[index];
      if (valveCard && valveCard.data) {
        const valveData = valveCard.data;
        if (valveData.size) {
          swgLabel = `${valveData.size} SWG`;
        }
      }
    }
    // 如果沒有閥件卡片，嘗試從 panel 資訊中提取
    if (!swgLabel && panelData.size) {
      swgLabel = `${panelData.size} SWG`;
    }

    // 檢查設備是否有閥件（panel 和 equipment 之間的閥件）
    const valve = group.valve || {};
    const valveData = valve.data || {};
    const hasValve = !!(valveData && Object.keys(valveData).length > 0);
    
    branches.push({
      swgLabel: swgLabel || 'SWG',
      chillerLines: chillerLines.length > 0 ? chillerLines : ['設備資訊'],
      pipelineLabel: pipelineLabel || '',
      hasValve: hasValve,  // 記錄是否有閥件
      valveType: valveData.valveType || '',  // 閥件種類
      valveSize: valveData.size || '',  // 閥件尺寸
      valveConnector: valveData.connectorType || ''  // 閥件接頭
    });
  });

  // 分支模組：從 branchModuleCards 提取
  const branchModuleCards = moduleSet.branchModuleCards || [];
  const branchModulesData = []; // 存儲分支模組的完整數據（當 enableValve 為 true 時）
  
  branchModuleCards.forEach((branchModule, branchIndex) => {
    const branchValve = branchModule.valve || {};
    const branchValveData = branchValve.data || {};
    const isBranchValveEnabled = branchValveData.enableValve === true;
    const branchPanelGroups = branchModule.panelEquipmentGroups || [];

    // 只有當 enableValve 為 true 時，才提取分支模組的完整數據
    if (isBranchValveEnabled) {
      const branchPipeline = branchModule.pipeline?.data || {};
      const branchFloor = branchModule.floor?.data || {};
      
      // 構建管線標籤
      const branchPipelineLength = branchPipeline.length || '';
      const branchPipelineMaterial = branchPipeline.material || '';
      const branchPipelineLabel = branchPipelineLength && branchPipelineMaterial 
        ? `${branchPipelineLength}M ${branchPipelineMaterial}` 
        : (branchPipelineLength ? `${branchPipelineLength}M` : pipelineLabel || '');

      branchPanelGroups.forEach((group, groupIndex) => {
        const panel = group.panel || {};
        const panelData = panel.data || {};
        const equipment = group.equipment || {};
        const equipmentData = equipment.data || {};

        // 構建 chillerLines
        const chillerLines = buildEquipmentLines(equipmentData, panelData, { 
          index: panelEquipmentGroups.length + branchIndex * branchPanelGroups.length + groupIndex,
          sourceGasType: sourceGasType
        });

        // 構建 SWG label（從分支閥件中提取）
        let swgLabel = '';
        if (branchValveData.size) {
          swgLabel = `${branchValveData.size} SWG`;
        }

        // 檢查分支設備是否有閥件（panel 和 equipment 之間的閥件）
        const panelEquipmentValve = group.valve || {};
        const panelEquipmentValveData = panelEquipmentValve.data || {};
        const hasBranchValve = !!(panelEquipmentValveData && Object.keys(panelEquipmentValveData).length > 0);
        
        branches.push({
          swgLabel: swgLabel || 'SWG',
          chillerLines: chillerLines.length > 0 ? chillerLines : ['設備資訊'],
          pipelineLabel: branchPipelineLabel,
          hasValve: hasBranchValve,  // 記錄是否有閥件
          valveType: panelEquipmentValveData.valveType || '',  // 閥件種類
          valveSize: panelEquipmentValveData.size || '',  // 閥件尺寸
          valveConnector: panelEquipmentValveData.connectorType || '',  // 閥件接頭
          branchIndex: branchIndex  // 保存原始分支索引，以便匹配 branchModulesData
        });
      });
      
      // 存儲分支模組的完整數據
      branchModulesData.push({
        branchIndex,
        pipeline: branchPipeline,
        floor: branchFloor,
        panelEquipmentGroups: branchPanelGroups.map((group) => {
          const panel = group.panel || {};
          const panelData = panel.data || {};
          const equipment = group.equipment || {};
          const equipmentData = equipment.data || {};
          const panelEquipmentValve = group.valve || {};
          const panelEquipmentValveData = panelEquipmentValve.data || {};
          
          return {
            panel: panelData,
            equipment: equipmentData,
            valve: panelEquipmentValveData,
            additionalEquipmentCards: (group.additionalEquipmentCards || []).map((card) => ({
              data: card?.data || {},
              valve: card?.valve?.data || {}
            }))
          };
        })
      });
    }
  });

  // 提取閥件數據（從分支模組中提取，使用上面已聲明的 branchModuleCards）
  const valveSizes = [];
  const valveLabels = [];
  const valveEnableStates = [];  // 記錄每個閥件的 enableValve 狀態
  const valveInfoList = [];  // 存儲完整的閥件資訊（尺寸、接頭、種類）
  
  // 從 branchModuleCards 提取閥件資訊（最多4個）
  branchModuleCards.slice(0, 4).forEach((branchModule) => {
    const valve = branchModule?.valve || {};
    const valveData = valve?.data || {};
    // 源頭閥件分支上方應該顯示連結分支尺吋（branchSize），而不是管線尺寸或閥件尺寸
    const branchSize = valveData.branchSize || '';  // 連結分支尺寸
    const valveSize = valveData.valveSize || valveData.size || '';  // 分支閥件尺寸
    const valveConnector = valveData.connectorType || '';  // 分支閥件接頭
    const valveType = valveData.valveType || '';  // 分支閥件種類
    const enableValve = valveData.enableValve || false;
    
    valveSizes.push(branchSize);  // 使用 branchSize 作為源頭閥件分支上方的標籤
    valveLabels.push(valveSize);  // 保留用於其他用途
    valveEnableStates.push(enableValve);
    valveInfoList.push({
      valveSize: valveSize,
      valveConnector: valveConnector,
      valveType: valveType
    });
  });
  
    // 如果閥件數量不足4個，用空值填充
    while (valveSizes.length < 4) {
      valveSizes.push('');
      valveLabels.push('');
      valveEnableStates.push(false);
      valveInfoList.push({
        valveSize: '',
        valveConnector: '',
        valveType: ''
      });
    }

  // 提取盤面分支數據（主分支的 panelEquipmentGroups 中除了第一個之外的其他群組）
  const mainPanelGroups = panelEquipmentGroups || [];
  const manifoldPanelBranches = [];
  if (mainPanelGroups.length > 1) {
    // 從第二個群組開始（索引1開始）
    mainPanelGroups.slice(1).forEach((group, index) => {
      const panel = group.panel || {};
      const panelData = panel.data || {};
      const equipment = group.equipment || {};
      const equipmentData = equipment.data || {};
      
      const chillerLines = buildEquipmentLines(equipmentData, panelData, { 
        index: index + 1,
        sourceGasType: sourceGasType
      });
      
      // 檢查盤面分支設備是否有閥件
      const manifoldValve = group.valve || {};
      const manifoldValveData = manifoldValve.data || {};
      const hasManifoldValve = !!(manifoldValveData && Object.keys(manifoldValveData).length > 0);
      
      manifoldPanelBranches.push({
        chillerLines: chillerLines.length > 0 ? chillerLines : ['設備資訊'],
        swgLabel: panelData.size ? `${panelData.size} SWG` : 'SWG',
        hasValve: hasManifoldValve,  // 記錄是否有閥件
        valveType: manifoldValveData.valveType || '',  // 閥件種類
        valveSize: manifoldValveData.size || '',  // 閥件尺寸
        valveConnector: manifoldValveData.connectorType || ''  // 閥件接頭
      });
    });
  }

  // 提取設備分支數據（第一個 panelEquipmentGroup 的 additionalEquipmentCards）
  const equipmentBranches = [];
  const firstPanelGroup = mainPanelGroups[0];
  if (firstPanelGroup && firstPanelGroup.additionalEquipmentCards) {
    firstPanelGroup.additionalEquipmentCards.forEach((equipmentCard, cardIndex) => {
      const equipmentData = equipmentCard?.data || {};
      const valveData = equipmentCard?.valve?.data || {};
      
      // 構建設備資訊
      const equipmentLines = buildEquipmentLines(equipmentData, {}, { sourceGasType: sourceGasType });
      
      // 檢查設備分支是否有閥件
      const equipmentValve = equipmentCard?.valve || {};
      const equipmentValveData = equipmentValve.data || {};
      const hasEquipmentValve = !!(equipmentValveData && Object.keys(equipmentValveData).length > 0);
      
      // 設備閥件分支和源頭閥件分支是完全無關的兩個東西
      // 設備閥件分支應該顯示設備閥件自己的尺寸（valveSize），而不是源頭閥件分支的 branchSize
      // 所以這裡不需要從 branchModuleCards 中獲取 branchSize
      
      equipmentBranches.push({
        equipmentLines: equipmentLines.length > 0 ? equipmentLines : ['設備資訊'],
        swgLabel: equipmentData.size ? `${equipmentData.size} SWG` : 'SWG',
        hasValve: hasEquipmentValve,  // 記錄是否有閥件
        valveType: equipmentValveData.valveType || '',  // 閥件種類
        valveSize: equipmentValveData.size || '',  // 閥件尺寸（用於顯示在設備閥件分支上方）
        valveConnector: equipmentValveData.connectorType || ''  // 閥件接頭
      });
    });
  }

  // 檢查是否有源頭主閥件（valveCards 中 type === 'valve' 的卡片）
  const valveCards = moduleSet.valveCards || [];
  const sourceMainValveCard = valveCards.find(card => card?.type === 'valve' && card?.data && Object.keys(card.data).length > 0);
  const hasSourceMainValve = !!sourceMainValveCard;
  const sourceMainValveData = sourceMainValveCard?.data || {};
  const sourceMainValveInfo = {
    valveType: sourceMainValveData.valveType || '',
    valveSize: sourceMainValveData.size || '',
    valveConnector: sourceMainValveData.connectorType || ''
  };

  // 提取分支源頭資訊卡片數據
  const branchSourceCards = moduleSet.branchSourceCards || [];
  const branchSourceDataList = branchSourceCards.map((card) => {
    const cardData = card?.data || {};
    return {
      lines: buildSourceLines(cardData, settings),  // 使用與源頭資訊相同的格式
      data: cardData
    };
  });

  return {
    sourceLines,
    branches: branches.length > 0 ? branches : [
      {
        swgLabel: 'SWG',
        chillerLines: ['設備資訊'],
        pipelineLabel: pipelineLabel || ''
      }
    ],
    valveSizes,
    valveLabels,
    valveEnableStates,      // 閥件啟用狀態
    valveInfoList,          // 閥件完整資訊列表（尺寸、接頭、種類）
    hasBranchModules: branchModuleCards.length > 0,  // 是否有分支模組
    hasSourceMainValve: hasSourceMainValve,  // 是否有源頭主閥件
    sourceMainValveInfo: sourceMainValveInfo,  // 源頭主閥件資訊
    branchSourceDataList,   // 分支源頭資訊數據列表
    branchModulesData,       // 分支模組完整數據（當 enableValve 為 true 時）
    manifoldPanelBranches,  // 盤面分支數據
    equipmentBranches       // 設備分支數據
  };
}

/**
 * 獲取連接線的管線類型（判斷條件與 App.vue 相同）
 * @param {Object} moduleSet - 模組組對象
 * @param {Object} connectionInfo - 連接線資訊
 * @returns {string} 管線類型：'單套管'、'雙套管'、'軟管'
 */
function getPipelineTypeForConnection(moduleSet, connectionInfo = {}) {
  // 默認使用源頭的 pipelineType
  let pipelineType = moduleSet.source?.data?.pipelineType || '單套管';
  
  // 特例1：設備閥件後方的連接線使用閥件的 backPipelineType
  if (connectionInfo.isValveToEquipment && connectionInfo.valve) {
    const valveBackPipelineType = connectionInfo.valve?.data?.backPipelineType;
    if (valveBackPipelineType) {
      pipelineType = valveBackPipelineType;
    }
  }
  
  // 特例2：盤面後方的連接線使用盤面的 backPipelineType
  if (connectionInfo.isPanelToEquipment && connectionInfo.panel) {
    const panelBackPipelineType = connectionInfo.panel?.data?.backPipelineType;
    if (panelBackPipelineType) {
      pipelineType = panelBackPipelineType;
    }
  }
  
  return pipelineType;
}

function drawModule(ctx, moduleSet, options) {
  const {
    width,
    offsetY,
    margin,
    settings
  } = options;

  // 從 moduleSet 提取真實數據（格式已轉換為符合渲染需求）
  const moduleData = extractModuleSetData(moduleSet, settings);
  
  // 獲取源頭的管線類型和氣體別（用於大部分連接線和設備資訊）
  const sourcePipelineType = moduleSet.source?.data?.pipelineType || '單套管';
  const sourceGasType = moduleSet.source?.data?.gasType || '';
  
  const sourceX = margin;
  const sourceY = offsetY;
  
  // 記錄模組的底部Y位置，用於計算實際高度
  // 初始值設為源頭資訊框的底部（如果沒有分支源頭資訊卡片）
  let moduleBottomY = sourceY + SOURCE_BLOCK_HEIGHT;
  
  // 計算源頭資訊框的實際寬度（根據內容自適應，但以當前尺寸為最小寬度）
  ctx.font = FONT_PRIMARY;
  const textPadding = 30; // 左右各15px的padding
  let maxTextWidth = 0;
  moduleData.sourceLines.forEach((line) => {
    const textWidth = ctx.measureText(line).width;
    if (textWidth > maxTextWidth) {
      maxTextWidth = textWidth;
    }
  });
  const actualSourceBlockWidth = Math.max(SOURCE_BLOCK_WIDTH, maxTextWidth + textPadding);
  
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#1f1f1f';
  ctx.strokeRect(sourceX, sourceY, actualSourceBlockWidth, SOURCE_BLOCK_HEIGHT);
  
  // Calculate text position for vertical centering
  const lineHeight = 30;
  const numLines = moduleData.sourceLines.length;
  const totalTextHeight = numLines * lineHeight;
  // Center the text block vertically: (block height - text height) / 2 + first line offset
  const textStartY = sourceY + (SOURCE_BLOCK_HEIGHT - totalTextHeight) / 2 + lineHeight - 5;
  
  drawTextBlock(ctx, moduleData.sourceLines, sourceX + 15, textStartY, {
    font: FONT_PRIMARY,
    lineHeight: lineHeight
  });

  // 繪製分支源頭資訊卡片（如果有）
  let branchSourceBottomY = sourceY + SOURCE_BLOCK_HEIGHT;
  if (moduleData.branchSourceDataList && moduleData.branchSourceDataList.length > 0) {
    const branchSourceSpacing = 20; // 分支源頭資訊卡片與源頭資訊之間的間距
    let currentBranchSourceY = sourceY + SOURCE_BLOCK_HEIGHT + branchSourceSpacing;
    
    moduleData.branchSourceDataList.forEach((branchSource, index) => {
      // 計算分支源頭資訊框的實際寬度
      ctx.font = FONT_PRIMARY;
      let maxBranchTextWidth = 0;
      branchSource.lines.forEach((line) => {
        const textWidth = ctx.measureText(line).width;
        if (textWidth > maxBranchTextWidth) {
          maxBranchTextWidth = textWidth;
        }
      });
      const actualBranchSourceBlockWidth = Math.max(SOURCE_BLOCK_WIDTH, maxBranchTextWidth + textPadding);
      
      // 繪製分支源頭資訊框
      ctx.strokeRect(sourceX, currentBranchSourceY, actualBranchSourceBlockWidth, SOURCE_BLOCK_HEIGHT);
      
      // 計算文本位置（垂直居中）
      const branchNumLines = branchSource.lines.length;
      const branchTotalTextHeight = branchNumLines * lineHeight;
      const branchTextStartY = currentBranchSourceY + (SOURCE_BLOCK_HEIGHT - branchTotalTextHeight) / 2 + lineHeight - 5;
      
      drawTextBlock(ctx, branchSource.lines, sourceX + 15, branchTextStartY, {
        font: FONT_PRIMARY,
        lineHeight: lineHeight
      });
      
      // 繪製連接線：從主管線連接到分支源頭資訊卡片
      // 判斷條件與 App.vue 相同：使用源頭的 pipelineType
      const pipelineType = moduleSet.source?.data?.pipelineType || '單套管';
      const branchSourceCenterY = currentBranchSourceY + SOURCE_BLOCK_HEIGHT / 2;
      const connectionStartX = sourceX + actualSourceBlockWidth + 30; // 起點在主源頭卡片右側一些
      const connectionEndX = sourceX + actualBranchSourceBlockWidth; // 終點在分支源頭卡片的右邊
      const mainLineY = sourceY + SOURCE_BLOCK_HEIGHT / 2; // 主管線的Y位置
      
      // 根據管線類型繪製不同樣式的連接線（判斷條件與 App.vue 相同：使用源頭的 pipelineType）
      // 垂直線：從主管線向下到分支源頭資訊卡片
      drawLineByType(ctx, connectionStartX, mainLineY, connectionStartX, branchSourceCenterY, pipelineType, true);
      // 水平線：連接到分支源頭資訊卡片右側
      drawLineByType(ctx, connectionStartX, branchSourceCenterY, connectionEndX, branchSourceCenterY, pipelineType, false);
      
      currentBranchSourceY += SOURCE_BLOCK_HEIGHT + branchSourceSpacing;
      branchSourceBottomY = currentBranchSourceY;
    });
  }

  // Starting point after source block
  let currentX = sourceX + actualSourceBlockWidth;
  const mainY = sourceY + SOURCE_BLOCK_HEIGHT / 2;

  // 判斷是否有分支模組數據，才繪製左側的垂直閥件
  const hasBranchModules = moduleData.hasBranchModules;
  let valveStartX = currentX + 30;
  let actualValveCount = 0;
  let valveBottomPositions = [];
  
  if (hasBranchModules && moduleData.valveSizes && moduleData.valveSizes.length > 0) {
    // Draw horizontal line to valves（使用源頭的管線類型）
    drawLineByType(ctx, currentX, mainY, valveStartX, mainY, sourcePipelineType, false);

    // Draw main horizontal line（使用源頭的管線類型）
    // 計算實際閥件數量（最多4個，且只計算有數據的閥件）
    const validValves = moduleData.valveSizes.filter((size, idx) => size || moduleData.valveLabels[idx]);
    actualValveCount = Math.min(validValves.length, 4);
    const mainLineEndX = valveStartX + VALVE_SPACING * actualValveCount;
    drawLineByType(ctx, valveStartX, mainY, mainLineEndX, mainY, sourcePipelineType, false);
    
    // Draw valves hanging from the main line (從 moduleData 提取)
    // 閥件順序由右到左，避免後條重疊
    const valveSizes = moduleData.valveSizes;
    const valveLabels = moduleData.valveLabels;
    const valveEnableStates = moduleData.valveEnableStates || [];
    
    // 創建索引映射：從右到左（實際索引 0,1,2,3 對應顯示位置 3,2,1,0）
    const reversedIndices = [];
    for (let i = actualValveCount - 1; i >= 0; i--) {
      reversedIndices.push(i);
    }
    
    reversedIndices.forEach((originalIndex, displayIndex) => {
    const valveCenterX = valveStartX + VALVE_SPACING * displayIndex + VALVE_SPACING / 2;
    
    // Draw vertical line from main line down to valve (increased distance)（使用源頭的管線類型）
    const topVertLineLength = 80;  // Match test-flowchart-render.html
    const valveTopY = mainY + topVertLineLength;
    
    drawLineByType(ctx, valveCenterX, mainY, valveCenterX, valveTopY, sourcePipelineType, true);
    
    const sizeLabel = valveSizes[originalIndex];
    const label = valveLabels[originalIndex];
    
    // Size label above main line
    ctx.font = FONT_SMALL;
    ctx.fillStyle = '#1f1f1f';
    ctx.textAlign = 'center';
    ctx.fillText(sizeLabel, valveCenterX, mainY - 8);
    ctx.textAlign = 'left';
    
    // Pipe size label next to top vertical line (rotated)
    ctx.font = FONT_SMALL;
    ctx.fillStyle = '#1f1f1f';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(valveCenterX + 25, mainY + topVertLineLength / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(label, 0, 0);
    ctx.restore();
    ctx.textAlign = 'left';
    
    // Draw valve symbol (vertical orientation)
    const valveCenterY = valveTopY + VALVE_SIZE / 2 + 5;
    drawValveSymbol(ctx, valveCenterX, valveCenterY, VALVE_SIZE, null, label, true);
    
    // Add label to the right of valve (rotated)
    // 顯示兩行文字：第一行 {分支閥件尺寸}{分支閥件接頭}，第二行 {分支閥件種類}
    const valveInfo = moduleData.valveInfoList?.[originalIndex] || {};
    const valveSize = valveInfo.valveSize || '';
    const valveConnector = valveInfo.valveConnector || '';
    const valveType = valveInfo.valveType || '';
    
    ctx.fillStyle = '#1f1f1f';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(valveCenterX + VALVE_SIZE / 2 + 15, valveCenterY);  // 從 +5 增加到 +15，文字往右移動
    ctx.rotate(-Math.PI / 2);
    
    // 第一行：{分支閥件尺寸}{分支閥件接頭}（尺寸與接頭之間要有空白）
    ctx.font = FONT_SMALL_ROTATED;
    const firstLine = [valveSize, valveConnector].filter(Boolean).join(' ');  // 使用空格連接，而不是直接連接
    if (firstLine) {
      ctx.fillText(firstLine, 0, -8);  // 向上偏移8px
    }
    
    // 第二行：{分支閥件種類}（使用更小的字體）
    if (valveType && valveType !== 'NA') {
      ctx.font = '14px "Microsoft JhengHei", "微軟正黑體", Arial';  // 比 FONT_SMALL_ROTATED (16px) 更小
      ctx.fillText(valveType, 0, 8);  // 向下偏移8px
    }
    
    ctx.restore();
    ctx.textAlign = 'left';
    
      // 只有當 enableValve 為 true 時，才繪製閥件下方的連接線（使用源頭的管線類型）
      // 使用原始索引來檢查 enableValve 狀態和存儲位置
      const enableValve = valveEnableStates[originalIndex] || false;
      if (enableValve) {
        const bottomVertLineLength = 40;
        const bottomVertLineStartY = valveCenterY + VALVE_SIZE / 2;
        const bottomVertLineEndY = bottomVertLineStartY + bottomVertLineLength;
        
        drawLineByType(ctx, valveCenterX, bottomVertLineStartY, valveCenterX, bottomVertLineEndY, sourcePipelineType, true);
        
        // 使用原始索引存儲位置，以便後續匹配分支數據
        if (!valveBottomPositions[originalIndex]) {
          valveBottomPositions[originalIndex] = {
            x: valveCenterX,
            y: bottomVertLineEndY,
            enabled: true,
            originalIndex: originalIndex  // 保存原始索引以便匹配
          };
        }
      } else {
        if (!valveBottomPositions[originalIndex]) {
          valveBottomPositions[originalIndex] = null;
        }
      }
    });
  } else {
    // 沒有分支模組時，直接連接到主線，不繪製閥件（使用源頭的管線類型）
    valveStartX = currentX;
    drawLineByType(ctx, currentX, mainY, valveStartX + 30, mainY, sourcePipelineType, false);
  }

  // After all valves
  const afterValvesX = hasBranchModules && actualValveCount > 0 
    ? valveStartX + VALVE_SPACING * actualValveCount 
    : valveStartX + 30;
  const unifiedLabelX = afterValvesX + 200;
  
  // 追蹤所有分支的底部位置，用於計算模組實際高度
  const branchBottomPositions = [];
  
  // Draw branches
  moduleData.branches.forEach((branch, index) => {
    let branchY, branchStartX;
    let branchModuleData = null; // 對應的分支模組完整數據（當 enableValve 為 true 時）
    
    if (index === 0) {
      // Main branch continues from main line (horizontal)
      branchY = mainY;
      branchStartX = afterValvesX;
    } else {
      // 其他分支：從啟用的垂直閥件延伸（從右到左順序）
      // 使用 branch.branchIndex 來匹配對應的閥件位置
      const branchBranchIndex = branch.branchIndex;
      if (branchBranchIndex !== undefined && branchBranchIndex < valveBottomPositions.length) {
        const valvePos = valveBottomPositions[branchBranchIndex];
        if (valvePos && valvePos.enabled) {
          branchStartX = valvePos.x;
          
          // 找出所有啟用的閥件位置，按從右到左的順序（原始索引從大到小），用於計算 Y 位置
          const enabledValvePositions = [];
          for (let i = valveBottomPositions.length - 1; i >= 0; i--) {
            const pos = valveBottomPositions[i];
            if (pos && pos.enabled) {
              enabledValvePositions.push({
                ...pos,
                originalIndex: i
              });
            }
          }
          
          // 找到當前分支在啟用閥件列表中的位置（從右到左）
          const branchValveIndex = enabledValvePositions.findIndex(p => p.originalIndex === branchBranchIndex);
          
          const manifoldBottom = ctx.canvas._manifoldBottomY || (mainY + 200);
          // 計算分支的 Y 位置，確保不重疊（減小距離）
          let prevBranchY = manifoldBottom + BOX_HEIGHT + 50; // 從 100 減小到 50
          for (let i = 0; i < branchValveIndex; i++) {
            const prevValvePos = enabledValvePositions[i];
            if (prevValvePos) {
              prevBranchY = Math.max(prevBranchY, prevValvePos.y + 30); // 從 50 減小到 30
            }
          }
          branchY = Math.max(valvePos.y + 30, prevBranchY + (branchValveIndex > 0 ? 100 : 0)); // 從 50 減小到 30，從 200 減小到 100
          
          // 從閥件到分支的垂直線（使用源頭的管線類型）
          drawLineByType(ctx, valvePos.x, valvePos.y, valvePos.x, branchY, sourcePipelineType, true);
          
          // 查找對應的分支模組數據（使用 branchIndex）
          branchModuleData = moduleData.branchModulesData?.find(bmd => bmd.branchIndex === branchBranchIndex);
        } else {
          // 如果閥件未啟用，跳過此分支
          return;
        }
      } else {
        // 如果沒有對應的閥件位置，跳過此分支
        return;
      }
    }
    
    // Draw branch line
    let beforeVertLineX;
    
    if (index === 0) {
      // Main branch: 在有分支模組閥件數據或源頭主閥件時繪製 check valve
      const shouldDrawCheckValve = (hasBranchModules && actualValveCount > 0) || moduleData.hasSourceMainValve;
      if (shouldDrawCheckValve) {
        // Main branch: with check valve（使用源頭的管線類型）
        const lineBeforeValveEndX = branchStartX + 50;
        drawLineByType(ctx, branchStartX, branchY, lineBeforeValveEndX, branchY, sourcePipelineType, false);
        
        const checkValveX = lineBeforeValveEndX + 35;
        // 傳入源頭主閥件資訊（如果有的話），使文字格式與設備閥件相同
        const checkValveInfo = moduleData.hasSourceMainValve ? moduleData.sourceMainValveInfo : {};
        drawCheckValve(ctx, checkValveX, branchY, 50, '1/2"', checkValveInfo);
        
        const afterCheckValveX = checkValveX + 35;
        const labelAreaEndX = afterCheckValveX + 250;
        
        drawLineByType(ctx, afterCheckValveX, branchY, labelAreaEndX, branchY, sourcePipelineType, false);

        ctx.font = FONT_SECONDARY;
        ctx.fillStyle = '#1f1f1f';
        ctx.fillText(branch.pipelineLabel, unifiedLabelX - 40, branchY - 12);
        
        beforeVertLineX = labelAreaEndX + 20;
        
        drawLineByType(ctx, labelAreaEndX, branchY, beforeVertLineX, branchY, sourcePipelineType, false);
      } else {
        // 沒有閥件數據時，主分支不繪製 check valve（使用源頭的管線類型）
        const labelAreaEndX = branchStartX + 400;
        
        drawLineByType(ctx, branchStartX, branchY, labelAreaEndX, branchY, sourcePipelineType, false);

        ctx.font = FONT_SECONDARY;
        ctx.fillStyle = '#1f1f1f';
        ctx.fillText(branch.pipelineLabel, unifiedLabelX - 40, branchY - 12);
        
        beforeVertLineX = labelAreaEndX + 20;
        
        drawLineByType(ctx, labelAreaEndX, branchY, beforeVertLineX, branchY, sourcePipelineType, false);
      }
    } else {
      // Other branches: no check valve（使用源頭的管線類型）
      // 對於分支模組，如果沒有 branchModuleData，才繪製 pipeline label
      // 如果有 branchModuleData，會在後面繪製完整的後方卡片（包括 pipeline label）
      if (!branchModuleData) {
        const labelAreaEndX = branchStartX + 400;
        
        drawLineByType(ctx, branchStartX, branchY, labelAreaEndX, branchY, sourcePipelineType, false);

        ctx.font = FONT_SECONDARY;
        ctx.fillStyle = '#1f1f1f';
        ctx.fillText(branch.pipelineLabel, unifiedLabelX - 40, branchY - 12);
        
        beforeVertLineX = labelAreaEndX + 20;
        
        drawLineByType(ctx, labelAreaEndX, branchY, beforeVertLineX, branchY, sourcePipelineType, false);
      } else {
        // 如果有 branchModuleData，只繪製從閥件到後方卡片的連接線起點
        beforeVertLineX = branchStartX;
      }
    }

    // Calculate positions from right side
    const canvasRightMargin = 0;  // Move Chiller to the rightmost edge
    const chillerBoxRightX = width - canvasRightMargin;
    const chillerBoxLeftX = chillerBoxRightX - CHILLER_BOX_WIDTH;
    
    // 計算設備卡片實際高度（適應內容，設備接點名稱可斷行）
    const lineHeight = 26;
    const actualBoxHeight = calculateEquipmentBoxHeight(
      ctx, 
      branch.chillerLines, 
      CHILLER_BOX_WIDTH, 
      lineHeight, 
      FONT_SECONDARY, 
      BOX_HEIGHT
    );
    
    // Chiller box
    const boxTop = branchY - actualBoxHeight / 2;
    ctx.strokeRect(chillerBoxLeftX, boxTop, CHILLER_BOX_WIDTH, actualBoxHeight);
    
    // 計算文本起始位置（垂直居中，考慮實際內容高度）
    // 使用第一行的行高作為起始偏移
    const textStartY = boxTop + lineHeight + 10; // 10px 上邊距
    
    drawTextBlock(ctx, branch.chillerLines, chillerBoxLeftX + 15, textStartY, {
      font: FONT_SECONDARY,
      lineHeight: lineHeight,
      maxWidth: CHILLER_BOX_WIDTH - 30  // 允許設備接點名稱斷行
    });
    
    // Line before chiller
    const lineBeforeChillerX = chillerBoxLeftX - 400;  // Moved further left for SWG box
    
    // 對於分支模組，如果已經繪製了 Panel 卡片，則不需要在這裡繪製閥件（會在 Panel 卡片後繪製）
    // 對於主分支或沒有 Panel 卡片的分支模組，在這裡繪製閥件
    const shouldDrawValveBeforeChiller = !(branchModuleData && index > 0 && branchModuleData.panelEquipmentGroups && branchModuleData.panelEquipmentGroups.length > 0);
    
    if (shouldDrawValveBeforeChiller) {
      // Draw valve before Chiller (只在設備有閥件時繪製)
      // 獲取盤面和閥件的管線類型（用於判斷連接線樣式）
      const panelEquipmentGroup = moduleSet.panelEquipmentGroups?.[index];
      const panel = panelEquipmentGroup?.panel || {};
      const panelData = panel.data || {};
      const panelBackPipelineType = panelData.backPipelineType || sourcePipelineType;
      const valve = panelEquipmentGroup?.valve || {};
      const valveData = valve.data || {};
      const valveBackPipelineType = valveData.backPipelineType || panelBackPipelineType;
      
      if (branch.hasValve) {
        const valveSize = 50;
        const valveCenterX = chillerBoxLeftX - valveSize / 2 - 70;  // Valve positioned at left side of Chiller (往左移動)
        
        // Line from SWG area to valve（使用盤面的 backPipelineType）
        drawLineByType(ctx, lineBeforeChillerX, branchY, valveCenterX - valveSize / 2 - 10, branchY, panelBackPipelineType, false);
        
        // Draw valve symbol (傳入閥件資訊)
        const valveInfo = {
          valveType: branch.valveType || '',
          valveSize: branch.valveSize || '',
          valveConnector: branch.valveConnector || ''
        };
        drawValveSymbol(ctx, valveCenterX, branchY, valveSize, '1/2"', null, false, valveInfo);
        
        // Line from valve to Chiller（使用閥件的 backPipelineType）
        drawLineByType(ctx, valveCenterX + valveSize / 2 + 10, branchY, chillerBoxLeftX, branchY, valveBackPipelineType, false);
      } else {
        // 沒有閥件時，直接從 SWG 連接到設備（使用盤面的 backPipelineType）
        drawLineByType(ctx, lineBeforeChillerX, branchY, chillerBoxLeftX, branchY, panelBackPipelineType, false);
      }
    }
    
    // SWG box (垂直置中於線條)
    const firstBoxRightX = lineBeforeChillerX;
    const firstBoxLeftX = firstBoxRightX - BOX_WIDTH;
    const swgBoxTop = branchY - BOX_HEIGHT / 2;  // 基於 BOX_HEIGHT 垂直置中
    ctx.strokeRect(firstBoxLeftX, swgBoxTop, BOX_WIDTH, BOX_HEIGHT);
    drawTextBlock(ctx, [branch.swgLabel], firstBoxLeftX + 15, swgBoxTop + BOX_HEIGHT / 2 + 8, {
      font: FONT_SECONDARY,
      align: 'left'
    });
    
    // 如果有分支模組完整數據（enableValve 為 true），繪製 pipeline、floor 和 panelEquipmentGroups 卡片
    let lineBeforeSWGX = firstBoxLeftX - 170; // 默認位置
    let vertLineX = lineBeforeSWGX;
    let vertLineBottom = branchY + 50; // 默認值
    
    if (branchModuleData && index > 0) {
      // 繪製分支模組的 pipeline 和 floor 卡片
      const branchPipeline = branchModuleData.pipeline || {};
      const branchFloor = branchModuleData.floor || {};
      
      // 構建 pipeline label
      const branchPipelineLength = branchPipeline.length || '';
      const branchPipelineMaterial = branchPipeline.material || '';
      const branchPipelineLabel = branchPipelineLength && branchPipelineMaterial 
        ? `${branchPipelineLength}M ${branchPipelineMaterial}` 
        : (branchPipelineLength ? `${branchPipelineLength}M` : '');
      
      // Pipeline label 位置（在 SWG 之前）
      const pipelineLabelX = firstBoxLeftX - 250;
      if (branchPipelineLabel) {
        ctx.font = FONT_SECONDARY;
        ctx.fillStyle = '#1f1f1f';
        ctx.fillText(branchPipelineLabel, pipelineLabelX - 40, branchY - 12);
      }
      
      // Floor labels 位置（在 pipeline label 之前）
      vertLineX = pipelineLabelX - 170;
      const vertLineTop = branchY - 50;
      vertLineBottom = branchY + 50;
      
      // Vertical line with floor labels（樓層資訊的垂直線始終使用單線，不需要樣式）
      ctx.beginPath();
      ctx.moveTo(vertLineX, vertLineTop);
      ctx.lineTo(vertLineX, vertLineBottom);
      ctx.stroke();

      // Floor labels（使用分支模組的樓層數據）
      const sourceFloor = branchFloor.sourceFloor || '';
      const equipmentFloor = branchFloor.equipmentFloor || '';
      ctx.font = FONT_SMALL;
      ctx.fillStyle = '#1f1f1f';
      ctx.textAlign = 'center';
      if (sourceFloor) {
        ctx.fillText(sourceFloor, vertLineX - 20, vertLineTop + 35);
      }
      if (equipmentFloor) {
        ctx.fillText(equipmentFloor, vertLineX + 20, vertLineTop + 35);
      }
      ctx.textAlign = 'left';
      
      // 連接線：從閥件底部（branchStartX）到 floor 標記
      // 對於分支模組，從閥件底部開始繪製連接線
      drawLineByType(ctx, branchStartX, branchY, vertLineX, branchY, sourcePipelineType, false);
      
      // 連接線：從 floor 標記到 pipeline label
      drawLineByType(ctx, vertLineX, branchY, pipelineLabelX, branchY, sourcePipelineType, false);
      
      // 連接線：從 pipeline label 到 SWG
      lineBeforeSWGX = pipelineLabelX;
      drawLineByType(ctx, lineBeforeSWGX, branchY, firstBoxLeftX, branchY, sourcePipelineType, false);
      
      // 源頭閥件分支後方不應有 Panel 卡片，直接從 SWG 連接到 Chiller
      // 但如果有 panel 和 equipment 之間的閥件，需要繪製閥件
      // 同時需要繪製額外設備、額外設備閥件及設備閥件分支
      if (branchModuleData.panelEquipmentGroups && branchModuleData.panelEquipmentGroups.length > 0) {
        const panelGroup = branchModuleData.panelEquipmentGroups[0]; // 第一個群組
        const panelValveData = panelGroup.valve || {};
        const equipmentData = panelGroup.equipment || {};
        const additionalEquipmentCards = panelGroup.additionalEquipmentCards || [];
        
        // 計算主設備卡片的位置
        let currentEquipmentX = chillerBoxLeftX;
        let lineBeforeEquipmentX = firstBoxRightX;
        
        // 如果有 panel 和 equipment 之間的閥件，繪製閥件
        if (panelValveData && panelValveData.size) {
          const panelValveSize = 50;
          const panelValveCenterX = firstBoxRightX + panelValveSize / 2 + 50; // 在 SWG 和 Chiller 之間
          const panelValveBackPipelineType = panelValveData.backPipelineType || sourcePipelineType;
          
          // 連接線：從 SWG 到閥件
          drawLineByType(ctx, firstBoxRightX, branchY, panelValveCenterX - panelValveSize / 2 - 10, branchY, sourcePipelineType, false);
          
          // 繪製閥件
          const panelValveInfo = {
            valveType: panelValveData.valveType || '',
            valveSize: panelValveData.size || '',
            valveConnector: panelValveData.connectorType || ''
          };
          drawValveSymbol(ctx, panelValveCenterX, branchY, panelValveSize, '1/2"', null, false, panelValveInfo);
          
          // 更新連接線起點
          lineBeforeEquipmentX = panelValveCenterX + panelValveSize / 2 + 10;
        }
        
        // 繪製主設備卡片（Chiller）
        const mainEquipmentLines = buildEquipmentLines(equipmentData, {}, { sourceGasType: sourceGasType });
        const lineHeight = 26;
        const actualMainEquipHeight = calculateEquipmentBoxHeight(
          ctx, 
          mainEquipmentLines, 
          CHILLER_BOX_WIDTH, 
          lineHeight, 
          FONT_SECONDARY, 
          BOX_HEIGHT
        );
        const mainEquipTop = branchY - actualMainEquipHeight / 2;
        
        // 連接線：從閥件（或 SWG）到主設備
        const panelValveBackPipelineType = panelValveData?.backPipelineType || sourcePipelineType;
        drawLineByType(ctx, lineBeforeEquipmentX, branchY, currentEquipmentX, branchY, panelValveBackPipelineType, false);
        
        // 繪製主設備卡片
        ctx.strokeRect(currentEquipmentX, mainEquipTop, CHILLER_BOX_WIDTH, actualMainEquipHeight);
        const mainEquipTextStartY = mainEquipTop + lineHeight + 10;
        drawTextBlock(ctx, mainEquipmentLines, currentEquipmentX + 15, mainEquipTextStartY, {
          font: FONT_SECONDARY,
          lineHeight: lineHeight,
          maxWidth: CHILLER_BOX_WIDTH - 30
        });
        
        // 繪製額外設備、額外設備閥件及設備閥件分支
        if (additionalEquipmentCards.length > 0) {
          const additionalEquipmentSpacing = 200; // 額外設備之間的間距
          let currentAdditionalX = currentEquipmentX + CHILLER_BOX_WIDTH + additionalEquipmentSpacing;
          
          additionalEquipmentCards.forEach((additionalCard, cardIndex) => {
            const additionalData = additionalCard.data || {};
            const additionalValveData = additionalCard.valve || {};
            const hasAdditionalValve = additionalValveData && additionalValveData.size;
            
            // 構建額外設備資訊
            const additionalLines = buildEquipmentLines(additionalData, {}, { sourceGasType: sourceGasType });
            
            // 計算額外設備卡片高度
            const actualAdditionalHeight = calculateEquipmentBoxHeight(
              ctx, 
              additionalLines, 
              CHILLER_BOX_WIDTH, 
              lineHeight, 
              FONT_SECONDARY, 
              BOX_HEIGHT
            );
            const additionalTop = branchY - actualAdditionalHeight / 2;
            
            // 如果有額外設備閥件，繪製閥件
            if (hasAdditionalValve) {
              const additionalValveSize = 50;
              const additionalValveCenterX = currentAdditionalX - additionalValveSize / 2 - 70;
              const additionalValveBackPipelineType = additionalValveData.backPipelineType || panelValveBackPipelineType;
              
              // 連接線：從前一個設備（或主設備）到閥件
              const prevEquipmentRightX = cardIndex === 0 
                ? currentEquipmentX + CHILLER_BOX_WIDTH 
                : currentAdditionalX - additionalEquipmentSpacing + CHILLER_BOX_WIDTH;
              drawLineByType(ctx, prevEquipmentRightX, branchY, additionalValveCenterX - additionalValveSize / 2 - 10, branchY, panelValveBackPipelineType, false);
              
              // 繪製閥件
              const additionalValveInfo = {
                valveType: additionalValveData.valveType || '',
                valveSize: additionalValveData.size || '',
                valveConnector: additionalValveData.connectorType || ''
              };
              drawValveSymbol(ctx, additionalValveCenterX, branchY, additionalValveSize, '1/2"', null, false, additionalValveInfo);
              
              // 連接線：從閥件到額外設備（使用閥件的 backPipelineType）
              drawLineByType(ctx, additionalValveCenterX + additionalValveSize / 2 + 10, branchY, currentAdditionalX, branchY, additionalValveBackPipelineType, false);
            } else {
              // 沒有閥件時，直接從前一個設備連接到額外設備
              const prevEquipmentRightX = cardIndex === 0 
                ? currentEquipmentX + CHILLER_BOX_WIDTH 
                : currentAdditionalX - additionalEquipmentSpacing + CHILLER_BOX_WIDTH;
              drawLineByType(ctx, prevEquipmentRightX, branchY, currentAdditionalX, branchY, panelValveBackPipelineType, false);
            }
            
            // 繪製額外設備卡片
            ctx.strokeRect(currentAdditionalX, additionalTop, CHILLER_BOX_WIDTH, actualAdditionalHeight);
            const additionalTextStartY = additionalTop + lineHeight + 10;
            drawTextBlock(ctx, additionalLines, currentAdditionalX + 15, additionalTextStartY, {
              font: FONT_SECONDARY,
              lineHeight: lineHeight,
              maxWidth: CHILLER_BOX_WIDTH - 30
            });
            
            // 更新下一個額外設備的 X 位置
            currentAdditionalX += CHILLER_BOX_WIDTH + additionalEquipmentSpacing;
          });
        } else {
          // 沒有額外設備時，直接從 SWG（或閥件）連接到主設備
          if (!panelValveData || !panelValveData.size) {
            drawLineByType(ctx, firstBoxRightX, branchY, currentEquipmentX, branchY, sourcePipelineType, false);
          }
        }
      } else {
        // 沒有 panelEquipmentGroups 時，直接從 SWG 連接到 Chiller
        drawLineByType(ctx, firstBoxRightX, branchY, chillerBoxLeftX, branchY, sourcePipelineType, false);
      }
    } else {
      // 沒有分支模組完整數據時，如果之前沒有繪製閥件，需要繪製從 SWG 到 Chiller 的連接線
      if (shouldDrawValveBeforeChiller && !branch.hasValve) {
        // 已經在 shouldDrawValveBeforeChiller 分支中繪製了連接線，這裡不需要重複繪製
      } else if (!shouldDrawValveBeforeChiller) {
        // 如果跳過了閥件繪製（因為有 Panel 卡片），但實際上沒有 Panel 卡片，需要繪製連接線
        drawLineByType(ctx, firstBoxRightX, branchY, chillerBoxLeftX, branchY, sourcePipelineType, false);
      }
      // 沒有分支模組完整數據時，使用默認的繪製邏輯
      // Line before SWG (keep floor labels position unchanged)（使用源頭的管線類型）
      drawLineByType(ctx, lineBeforeSWGX, branchY, firstBoxLeftX, branchY, sourcePipelineType, false);
      
      // Vertical line with floor labels（樓層資訊的垂直線始終使用單線，不需要樣式）
      const vertLineTop = branchY - 50;
      vertLineBottom = branchY + 50;
      
      ctx.beginPath();
      ctx.moveTo(vertLineX, vertLineTop);
      ctx.lineTo(vertLineX, vertLineBottom);
      ctx.stroke();

      // Floor labels
      ctx.font = FONT_SMALL;
      ctx.fillStyle = '#1f1f1f';
      ctx.textAlign = 'center';
      ctx.fillText('2F', vertLineX - 20, vertLineTop + 35);
      ctx.fillText('3F', vertLineX + 20, vertLineTop + 35);
      ctx.textAlign = 'left';

      // Connect to the pipeline（使用源頭的管線類型）
      drawLineByType(ctx, beforeVertLineX, branchY, vertLineX, branchY, sourcePipelineType, false);
    }
    
    // 記錄分支的底部位置（設備卡片底部或垂直線底部）
    const branchBottom = Math.max(
      boxTop + actualBoxHeight,
      vertLineBottom  // 垂直線的底部
    );
    branchBottomPositions.push(branchBottom);
    
    // Add manifold panel for main branch only (只在有盤面分支數據時繪製)
    if (index === 0 && moduleData.manifoldPanelBranches && moduleData.manifoldPanelBranches.length > 0) {
      const manifoldX = vertLineX + 75;  // Moved right for manifold branches
      const manifoldTopY = branchY;
      const manifoldBranchSpacing = 140;
      const numManifoldBranches = moduleData.manifoldPanelBranches.length;
      const manifoldBottomY = branchY + numManifoldBranches * manifoldBranchSpacing;
      
      // Horizontal line from floor marker to manifold（使用源頭的管線類型）
      drawLineByType(ctx, vertLineX, branchY, manifoldX, branchY, sourcePipelineType, false);
      
      // Vertical manifold line（使用源頭的管線類型）
      drawLineByType(ctx, manifoldX, manifoldTopY, manifoldX, manifoldBottomY, sourcePipelineType, true);
      
      // Draw manifold branches based on actual data
      const manifoldBranchYPositions = moduleData.manifoldPanelBranches.map((_, idx) => 
        branchY + (idx + 1) * manifoldBranchSpacing
      );
      
      // Connection mapping: line order -> branch order (removed first branch)
      // Line 0 (first, leftmost) -> Branch 2 (second, bottom with equipment)
      // Line 1 (second) -> Branch 1 (first, top)
      // Branch 0 removed
      const connectionMap = [1, 0];  // Line index -> Branch index (map to branchIdx 1 and 2, but use 0 and 1 in array)
      
      manifoldBranchYPositions.forEach((yPos, branchIdx) => {
        const manifoldBranchData = moduleData.manifoldPanelBranches[branchIdx];
        if (!manifoldBranchData) return;
        
        // Find which line connects to this branch
        // branchIdx 0 -> Branch 1 (was Branch 0) -> Line 1
        // branchIdx 1 -> Branch 2 (was Branch 1) -> Line 0
        const lineIdx = branchIdx === 0 ? 1 : 0;  // Reverse mapping
        
        // All lines start from same Y, different X
        const startY = branchY;
        const lineOffsetX = lineIdx * 20;
        const lineStartX = manifoldX + lineOffsetX;
        
        // 獲取盤面分支的管線類型（使用盤面的 backPipelineType）
        const manifoldPanel = moduleSet.panelEquipmentGroups?.[branchIdx + 1];
        const manifoldPanelData = manifoldPanel?.panel?.data || {};
        const manifoldPipelineType = manifoldPanelData.backPipelineType || sourcePipelineType;
        
        // Draw vertical line（使用盤面分支的管線類型）
        drawLineByType(ctx, lineStartX, startY, lineStartX, yPos, manifoldPipelineType, true);
        
        // Draw horizontal line（使用盤面分支的管線類型）
        const lineAfterBranch = lineStartX + 30;  // Reduced to move SWG cards left
        drawLineByType(ctx, lineStartX, yPos, lineAfterBranch, yPos, manifoldPipelineType, false);
        
        // 使用實際數據
        const manifoldChillerLines = manifoldBranchData.chillerLines || ['設備資訊'];
        
        // 計算設備卡片實際高度（適應內容，設備接點名稱可斷行）
        const lineHeight = 26;
        const actualManifoldBoxHeight = calculateEquipmentBoxHeight(
          ctx, 
          manifoldChillerLines, 
          CHILLER_BOX_WIDTH, 
          lineHeight, 
          FONT_SECONDARY, 
          BOX_HEIGHT
        );
        
        const manifoldBoxTop = yPos - actualManifoldBoxHeight / 2;
        
        // Chiller box
        ctx.strokeRect(chillerBoxLeftX, manifoldBoxTop, CHILLER_BOX_WIDTH, actualManifoldBoxHeight);
        
        // 計算文本起始位置（垂直居中，考慮實際內容高度）
        const textStartY = manifoldBoxTop + lineHeight + 10; // 10px 上邊距
        
        drawTextBlock(ctx, manifoldChillerLines, chillerBoxLeftX + 15, textStartY, {
          font: FONT_SECONDARY,
          lineHeight: lineHeight,
          maxWidth: CHILLER_BOX_WIDTH - 30  // 允許設備接點名稱斷行
        });
        
        // Line before chiller
        const manifoldLineBeforeChillerX = chillerBoxLeftX - 400;  // Moved further left for SWG box
        
        // 獲取盤面分支的閥件管線類型
        const manifoldValve = manifoldPanel?.valve || {};
        const manifoldValveData = manifoldValve.data || {};
        const manifoldValveBackPipelineType = manifoldValveData.backPipelineType || manifoldPipelineType;
        
        // 定義閥件相關變量（即使沒有閥件也需要定義，因為後續代碼可能會使用）
        const manifoldValveSize = 50;
        const manifoldValveCenterX = chillerBoxLeftX - manifoldValveSize / 2 - 70;  // Valve positioned at left side of Chiller (往左移動)
        
        // Draw valve before Chiller (只在設備有閥件時繪製)
        if (manifoldBranchData.hasValve) {
          // Line from SWG area to valve（使用盤面分支的管線類型）
          drawLineByType(ctx, manifoldLineBeforeChillerX, yPos, manifoldValveCenterX - manifoldValveSize / 2 - 10, yPos, manifoldPipelineType, false);
          
          // Draw valve symbol (傳入閥件資訊)
          const manifoldValveInfo = {
            valveType: manifoldBranchData.valveType || '',
            valveSize: manifoldBranchData.valveSize || '',
            valveConnector: manifoldBranchData.valveConnector || ''
          };
          drawValveSymbol(ctx, manifoldValveCenterX, yPos, manifoldValveSize, '1/2"', null, false, manifoldValveInfo);
          
          // Line from valve to Chiller（使用閥件的 backPipelineType）
          drawLineByType(ctx, manifoldValveCenterX + manifoldValveSize / 2 + 10, yPos, chillerBoxLeftX, yPos, manifoldValveBackPipelineType, false);
        } else {
          // 沒有閥件時，直接從 SWG 連接到設備（使用盤面分支的管線類型）
          drawLineByType(ctx, manifoldLineBeforeChillerX, yPos, chillerBoxLeftX, yPos, manifoldPipelineType, false);
        }
        
        // SWG box (垂直置中於線條)
        const manifoldFirstBoxRightX = manifoldLineBeforeChillerX;
        const manifoldFirstBoxLeftX = manifoldFirstBoxRightX - BOX_WIDTH;
        const manifoldSwgBoxTop = yPos - BOX_HEIGHT / 2;  // 基於 BOX_HEIGHT 垂直置中
        ctx.strokeRect(manifoldFirstBoxLeftX, manifoldSwgBoxTop, BOX_WIDTH, BOX_HEIGHT);
        drawTextBlock(ctx, [manifoldBranchData.swgLabel || 'SWG'], manifoldFirstBoxLeftX + 15, manifoldSwgBoxTop + BOX_HEIGHT / 2 + 8, {
          font: FONT_SECONDARY,
          align: 'left'
        });
        
        // Line from branch to SWG（使用盤面分支的管線類型）
        drawLineByType(ctx, lineAfterBranch, yPos, manifoldFirstBoxLeftX, yPos, manifoldPipelineType, false);
        
        // Add equipment branch valves (只在有設備分支數據時繪製，且只在最後一個盤面分支時繪製)
        if (branchIdx === manifoldBranchYPositions.length - 1 && moduleData.equipmentBranches && moduleData.equipmentBranches.length > 0) {
          // Draw parallel equipment branch valves connected to the left side of the equipment
          const branchSpacing = 60;  // Reduced horizontal spacing between branches
          // Position branches to the left of the equipment valve
          const leftOffset = 100;  // Increased offset to move branches further left
          const numEquipmentBranches = moduleData.equipmentBranches.length;
          const branchXPositions = [];
          
          // 計算每個設備分支的X位置
          for (let i = 0; i < numEquipmentBranches; i++) {
            const offset = (i - (numEquipmentBranches - 1) / 2) * branchSpacing;
            branchXPositions.push(manifoldValveCenterX + offset - leftOffset);
          }
          
          // Draw horizontal connection line on the panel equipment line, from left side of equipment（使用閥件的 backPipelineType）
          const horizontalLineLeftX = branchXPositions[0];
          const horizontalLineRightX = branchXPositions[branchXPositions.length - 1];
          const connectionPointX = manifoldValveCenterX - manifoldValveSize / 2 - 10;  // Left side of equipment valve
          drawLineByType(ctx, horizontalLineLeftX, yPos, horizontalLineRightX, yPos, manifoldValveBackPipelineType, false);
          
          // Draw connecting line from equipment valve left side to branch connection line（使用閥件的 backPipelineType）
          drawLineByType(ctx, connectionPointX, yPos, horizontalLineRightX, yPos, manifoldValveBackPipelineType, false);
          
          const branchValveSpacing = 80;  // Vertical distance from equipment line to valve
          
          branchXPositions.forEach((branchX, branchValveIdx) => {
            const equipmentBranchData = moduleData.equipmentBranches[branchValveIdx];
            if (!equipmentBranchData) return;
            
            // 設備閥件分支應該顯示設備閥件自己的尺寸（valveSize）
            // 設備閥件分支和源頭閥件分支是完全無關的兩個東西
            const branchSize = equipmentBranchData.valveSize || '';
            // Draw vertical line from panel equipment line down to branch valve（使用閥件的 backPipelineType）
            const branchValveTopY = yPos + branchValveSpacing;
            const branchValveSize = 50;
            const branchValveCenterY = branchValveTopY + branchValveSize / 2 + 5;
            
            drawLineByType(ctx, branchX, yPos, branchX, branchValveTopY, manifoldValveBackPipelineType, true);
            
            // Add size label above each branch valve connection line
            if (branchSize) {
              ctx.font = FONT_SMALL;
              ctx.fillStyle = '#1f1f1f';
              ctx.textAlign = 'center';
              const textY = yPos - 10;  // Position text above the connection line
              ctx.fillText(branchSize, branchX, textY);
              ctx.textAlign = 'left';
            }
            
            // Pipe size label next to vertical line (rotated -90 degrees)
            if (branchSize) {
              ctx.font = FONT_SMALL;
              ctx.fillStyle = '#1f1f1f';
              ctx.textAlign = 'center';
              ctx.save();
              ctx.translate(branchX + 25, yPos + branchValveSpacing / 2);
              ctx.rotate(-Math.PI / 2);
              ctx.fillText(branchSize, 0, 0);
              ctx.restore();
              ctx.textAlign = 'left';
            }
            
            // Draw branch valve (vertical orientation)
            drawValveSymbol(ctx, branchX, branchValveCenterY, branchValveSize, null, branchSize, true);
            
            // Add label to the right of the branch valve (rotated -90 degrees)
            ctx.font = FONT_SMALL_ROTATED;
            ctx.fillStyle = '#1f1f1f';
            ctx.textAlign = 'center';
            ctx.save();
            ctx.translate(branchX + branchValveSize / 2 + 5, branchValveCenterY);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(equipmentBranchData.swgLabel || 'SWG', 0, 0);
            ctx.restore();
            ctx.textAlign = 'left';
            
            // For the last branch valve, draw L-shaped line and equipment card (if it's the last one)
            if (branchValveIdx === branchXPositions.length - 1) {
              // Calculate valve bottom position
              const branchValveBottomY = branchValveCenterY + branchValveSize / 2;
              
              // L-shaped line: first vertical down, then horizontal right
              const verticalLineLength = 100;  // Vertical distance
              const verticalLineEndY = branchValveBottomY + verticalLineLength;
              
              // Equipment card text (使用實際數據)
              const equipCardLines = equipmentBranchData.equipmentLines || ['設備資訊'];
              
              // 計算設備卡片實際高度（適應內容，設備接點名稱可斷行）
              const lineHeight = 26;
              const actualEquipCardHeight = calculateEquipmentBoxHeight(
                ctx, 
                equipCardLines, 
                CHILLER_BOX_WIDTH, 
                lineHeight, 
                FONT_SECONDARY, 
                BOX_HEIGHT
              );
              
              // Calculate equipment card position: X aligned with other equipment cards, Y moved up
              const equipCardLeftX = chillerBoxLeftX;  // Align X with other equipment cards
              const upwardOffset = 30;  // Move Y up by this amount
              const equipCardCenterY = verticalLineEndY - upwardOffset;
              const equipCardTop = equipCardCenterY - actualEquipCardHeight / 2;
              
              // 獲取設備分支閥件的管線類型（使用閥件的 backPipelineType）
              const firstPanelGroup = moduleSet.panelEquipmentGroups?.[0];
              const equipmentCard = firstPanelGroup?.additionalEquipmentCards?.[branchValveIdx];
              const equipmentValve = equipmentCard?.valve || {};
              const equipmentValveData = equipmentValve.data || {};
              const equipmentValveBackPipelineType = equipmentValveData.backPipelineType || manifoldValveBackPipelineType;
              
              // Draw vertical line down from valve（使用設備分支閥件的 backPipelineType）
              drawLineByType(ctx, branchX, branchValveBottomY, branchX, verticalLineEndY, equipmentValveBackPipelineType, true);
              
              // Draw horizontal line to the right (L-shaped, right angle)（使用設備分支閥件的 backPipelineType）
              drawLineByType(ctx, branchX, verticalLineEndY, equipCardLeftX, verticalLineEndY, equipmentValveBackPipelineType, false);
              
              // Draw vertical line up to equipment card center (if needed)（使用設備分支閥件的 backPipelineType）
              if (equipCardCenterY !== verticalLineEndY) {
                drawLineByType(ctx, equipCardLeftX, verticalLineEndY, equipCardLeftX, equipCardCenterY, equipmentValveBackPipelineType, true);
              }
              ctx.strokeRect(equipCardLeftX, equipCardTop, CHILLER_BOX_WIDTH, actualEquipCardHeight);
              
              // 計算文本起始位置（垂直居中，考慮實際內容高度）
              const textStartY = equipCardTop + lineHeight + 10; // 10px 上邊距
              
              drawTextBlock(ctx, equipCardLines, equipCardLeftX + 15, textStartY, {
                font: FONT_SECONDARY,
                lineHeight: lineHeight,
                maxWidth: CHILLER_BOX_WIDTH - 30  // 允許設備接點名稱斷行
              });
            }
          });
        }
        
        // Add equipment branches for last manifold branch (只在有設備分支數據時繪製)
        if (branchIdx === manifoldBranchYPositions.length - 1 && moduleData.equipmentBranches && moduleData.equipmentBranches.length > 0) {
          const equipmentBaseX = manifoldFirstBoxRightX + 30;
          const equipmentBranchSpacing = 150;  // Increased spacing between equipment
          
          // Calculate the bottom of the branch valves to position equipment below them
          const branchValveHeight = 80 + 25 + 5 + 25 + 40;  // branchValveSpacing + branchValveSize/2 + offset + branchValveSize/2 + branchBottomLineLength
          const extraSpacing = 20;
          const branchValveBottomY = yPos + branchValveHeight + extraSpacing;
          
          // Draw equipment branches based on actual data
          const numEquipmentBranches = moduleData.equipmentBranches.length;
          const equipmentYPositions = [];
          for (let i = 0; i < numEquipmentBranches; i++) {
            equipmentYPositions.push(branchValveBottomY + (i + 1) * equipmentBranchSpacing);
          }
          
          equipmentYPositions.forEach((equipY, equipBranchIdx) => {
            const equipmentBranchData = moduleData.equipmentBranches[equipBranchIdx];
            if (!equipmentBranchData) return;
            // Find which line connects to this equipment
            // equipBranchIdx 0 -> Equipment 1 (was Equipment 0) -> Line 1
            // equipBranchIdx 1 -> Equipment 2 (was Equipment 1) -> Line 0
            const equipLineIdx = equipBranchIdx === 0 ? 1 : 0;  // Reverse mapping
            
            const equipStartY = yPos;
            const equipLineOffsetX = equipLineIdx * 20;
            const equipLineStartX = equipmentBaseX + equipLineOffsetX;
        
            // 獲取設備分支的管線類型（使用閥件的 backPipelineType）
            const firstPanelGroup = moduleSet.panelEquipmentGroups?.[0];
            const equipmentCard = firstPanelGroup?.additionalEquipmentCards?.[equipBranchIdx];
            const equipmentValve = equipmentCard?.valve || {};
            const equipmentValveData = equipmentValve.data || {};
            const equipmentPipelineType = equipmentValveData.backPipelineType || manifoldValveBackPipelineType;
            
            // Draw vertical line（使用設備分支的管線類型）
            drawLineByType(ctx, equipLineStartX, equipStartY, equipLineStartX, equipY, equipmentPipelineType, true);
            
            // Draw horizontal line（使用設備分支的管線類型）
            const equipLineEndX = equipLineStartX + 50;
            drawLineByType(ctx, equipLineStartX, equipY, equipLineEndX, equipY, equipmentPipelineType, false);
            
            // Draw valve before Equipment (只在設備有閥件時繪製)
            if (equipmentBranchData.hasValve) {
              const equipValveSize = 50;
              const equipValveCenterX = chillerBoxLeftX - equipValveSize / 2 - 70;  // Valve positioned at left side of Equipment (往左移動)
              
              // Line from horizontal line to valve（使用設備分支的管線類型）
              drawLineByType(ctx, equipLineEndX, equipY, equipValveCenterX - equipValveSize / 2 - 10, equipY, equipmentPipelineType, false);
              
              // Draw valve symbol (傳入閥件資訊)
              const equipValveInfo = {
                valveType: equipmentBranchData.valveType || '',
                valveSize: equipmentBranchData.valveSize || '',
                valveConnector: equipmentBranchData.valveConnector || ''
              };
              drawValveSymbol(ctx, equipValveCenterX, equipY, equipValveSize, '1/4"', null, false, equipValveInfo);
              
              // Line from valve to Equipment box（使用設備分支閥件的 backPipelineType）
              const equipValveBackPipelineType = equipmentValveData.backPipelineType || equipmentPipelineType;
              drawLineByType(ctx, equipValveCenterX + equipValveSize / 2 + 10, equipY, chillerBoxLeftX, equipY, equipValveBackPipelineType, false);
            } else {
              // 沒有閥件時，直接從水平線連接到設備（使用設備分支的管線類型）
              drawLineByType(ctx, equipLineEndX, equipY, chillerBoxLeftX, equipY, equipmentPipelineType, false);
            }
            
            // 使用實際數據
            const equipChillerLines = equipmentBranchData.equipmentLines || ['設備資訊'];
            
            // 計算設備卡片實際高度（適應內容，設備接點名稱可斷行）
            const lineHeight = 26;
            const actualEquipBoxHeight = calculateEquipmentBoxHeight(
              ctx, 
              equipChillerLines, 
              CHILLER_BOX_WIDTH, 
              lineHeight, 
              FONT_SECONDARY, 
              BOX_HEIGHT
            );
            
            // Equipment box
            const equipBoxTop = equipY - actualEquipBoxHeight / 2;
            ctx.strokeRect(chillerBoxLeftX, equipBoxTop, CHILLER_BOX_WIDTH, actualEquipBoxHeight);
            
            // 計算文本起始位置（垂直居中，考慮實際內容高度）
            const textStartY = equipBoxTop + lineHeight + 10; // 10px 上邊距
            
            drawTextBlock(ctx, equipChillerLines, chillerBoxLeftX + 15, textStartY, {
              font: FONT_SECONDARY,
              lineHeight: lineHeight,
              maxWidth: CHILLER_BOX_WIDTH - 30  // 允許設備接點名稱斷行
            });
          });
        }
      });
      
      // Store manifold bottom for positioning other branches
      const lastManifoldY = manifoldBranchYPositions[manifoldBranchYPositions.length - 1];
      const numEquipmentBranches = (moduleData.equipmentBranches && moduleData.equipmentBranches.length) || 0;
      const equipmentExtension = 150 * numEquipmentBranches;  // Use same spacing as equipment branches
      
      // Calculate additional space needed for branch valves (only for the last manifold branch which has equipment)
      // branchValveSpacing (80) + branchValveSize/2 (25) + offset (5) + branchValveSize/2 (25) + branchBottomLineLength (40) = 175
      // Total height from yPos (panel equipment line) to bottom of branch valve
      const branchValveHeight = 80 + 25 + 5 + 25 + 40;  // branchValveSpacing + branchValveSize/2 + offset + branchValveSize/2 + branchBottomLineLength
      // Only add extension if this is the last branch which has equipment branches
      const branchValveExtension = (numEquipmentBranches > 0) ? branchValveHeight : 0;
      // Add extra spacing for better visual separation
      const extraSpacing = 20;
      
      ctx.canvas._manifoldBottomY = lastManifoldY + equipmentExtension + branchValveExtension + extraSpacing;
      
      // 更新模組底部位置（盤面分支的底部）
      const manifoldBottom = ctx.canvas._manifoldBottomY;
      if (manifoldBottom > moduleBottomY) {
        moduleBottomY = manifoldBottom;
      }
    }
  });
  
  // 計算所有分支的底部位置，找出最底部
  branchBottomPositions.forEach((bottomY) => {
    if (bottomY > moduleBottomY) {
      moduleBottomY = bottomY;
    }
  });
  
  // 如果有盤面分支，使用盤面分支的底部
  if (moduleData.manifoldPanelBranches && moduleData.manifoldPanelBranches.length > 0) {
    const manifoldBottom = ctx.canvas._manifoldBottomY;
    if (manifoldBottom && manifoldBottom > moduleBottomY) {
      moduleBottomY = manifoldBottom;
    }
  }
  
  // 如果沒有分支，使用源頭資訊框或分支源頭資訊卡片的底部
  if (branchBottomPositions.length === 0) {
    // 如果有分支源頭資訊卡片，使用其底部；否則使用源頭資訊框的底部
    const sourceBottom = branchSourceBottomY > sourceY + SOURCE_BLOCK_HEIGHT 
      ? branchSourceBottomY 
      : sourceY + SOURCE_BLOCK_HEIGHT;
    if (sourceBottom > moduleBottomY) {
      moduleBottomY = sourceBottom;
    }
  } else {
    // 如果有分支，也要考慮分支源頭資訊卡片的高度
    // 雖然通常分支會更低，但為了準確計算，我們也要檢查分支源頭資訊卡片
    if (branchSourceBottomY > moduleBottomY) {
      moduleBottomY = branchSourceBottomY;
    }
  }
  
  // 添加模組間距
  const moduleSpacing = 50;
  moduleBottomY += moduleSpacing;
  
  // 返回實際使用的高度
  return moduleBottomY - offsetY;
}

function renderFlowchartSegmentToDataURL(moduleSets = [], options = {}) {
  if (typeof document === 'undefined' || !Array.isArray(moduleSets)) {
    return null;
  }

  const width = options.width || DEFAULT_CANVAS_WIDTH;
  const margin = options.margin || DEFAULT_MARGIN;
  const settings = options.settings || {};

  // 先計算每個模組的實際高度（使用臨時canvas）
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = 10000; // 臨時高度，足夠大
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.fillStyle = '#ffffff';
  tempCtx.fillRect(0, 0, width, 10000);
  tempCtx.strokeStyle = '#1f1f1f';
  tempCtx.lineWidth = 4;
  tempCtx.lineJoin = 'round';
  tempCtx.lineCap = 'round';
  
  const moduleHeights = [];
  let currentOffsetY = margin;
  
  // 計算每個模組的實際高度
  moduleSets.forEach((moduleSet, index) => {
    const actualHeight = drawModule(tempCtx, moduleSet, {
      width,
      margin,
      offsetY: currentOffsetY,
      settings
    });
    moduleHeights.push(actualHeight);
    currentOffsetY += actualHeight;
  });
  
  // 計算總高度
  const totalHeight = Math.max(
    currentOffsetY + margin,
    DEFAULT_CANVAS_HEIGHT
  );

  // 創建實際的canvas並繪製
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = totalHeight;

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, totalHeight);
  ctx.strokeStyle = '#1f1f1f';
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // 依序繪製每個模組，根據實際高度定位
  let cumulativeOffsetY = margin;
  moduleSets.forEach((moduleSet, index) => {
    drawModule(ctx, moduleSet, {
      width,
      margin,
      offsetY: cumulativeOffsetY,
      settings
    });
    cumulativeOffsetY += moduleHeights[index];
  });

  return canvas.toDataURL('image/png');
}

function splitModuleSets(moduleSets = [], pageBreaks = []) {
  if (!Array.isArray(moduleSets) || moduleSets.length === 0) {
    return [];
  }

  const breaks = Array.from(new Set(pageBreaks))
    .filter((index) => Number.isInteger(index) && index >= 0 && index < moduleSets.length - 1)
    .sort((a, b) => a - b);

  const segments = [];
  let startIndex = 0;

  breaks.forEach((breakIndex) => {
    const endIndex = breakIndex + 1;
    if (endIndex > startIndex) {
      segments.push(moduleSets.slice(startIndex, endIndex));
      startIndex = endIndex;
    }
  });

  if (startIndex < moduleSets.length) {
    segments.push(moduleSets.slice(startIndex));
  }

  return segments;
}

export function renderFlowchartPages(moduleSets = [], pageBreaks = [], options = {}) {
  if (typeof document === 'undefined') {
    return [];
  }

  const segments = splitModuleSets(moduleSets, pageBreaks);
  const targetSegments = segments.length > 0 ? segments : [moduleSets];

  return targetSegments
    .map((segment) => renderFlowchartSegmentToDataURL(segment, options))
    .filter((dataUrl) => !!dataUrl);
}


