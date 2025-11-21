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

    // 檢查設備是否有閥件（panel 和 equipment 之間的閥件）
    const valve = group.valve || {};
    const valveData = valve.data || {};
    const hasValve = !!(valveData && Object.keys(valveData).length > 0);

    // 構建 SWG label：{盤面尺吋}{盤面Valve接頭}
    // 盤面尺吋從 panelData.size 獲取，盤面Valve接頭從 panelData.valveConnector 獲取
    let swgLabel = '';
    const panelSize = panelData.size || '';
    // 使用 panelData.valveConnector，確保 "SWG" 也能正確顯示
    const valveConnector = panelData.valveConnector !== undefined && panelData.valveConnector !== null
      ? String(panelData.valveConnector)
      : '';

    if (panelSize && valveConnector) {
      swgLabel = `${panelSize} ${valveConnector}`;
    } else if (panelSize) {
      swgLabel = panelSize;
    } else if (valveConnector) {
      swgLabel = valveConnector;
    } else {
      swgLabel = 'SWG';
    }

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

      // 只將第一個 group 作為主分支，其他的作為額外盤面處理
      // 這樣可以避免一個源頭閥件分支出現多條分離的線
      if (branchPanelGroups.length > 0) {
        const firstGroup = branchPanelGroups[0];
        const panel = firstGroup.panel || {};
        const panelData = panel.data || {};
        const equipment = firstGroup.equipment || {};
        const equipmentData = equipment.data || {};

        // 構建 chillerLines
        const chillerLines = buildEquipmentLines(equipmentData, panelData, {
          index: panelEquipmentGroups.length + branchIndex,
          sourceGasType: sourceGasType
        });

        // 檢查分支設備是否有閥件（panel 和 equipment 之間的閥件）
        const panelEquipmentValve = firstGroup.valve || {};
        const panelEquipmentValveData = panelEquipmentValve.data || {};
        const hasBranchValve = !!(panelEquipmentValveData && Object.keys(panelEquipmentValveData).length > 0);

        // 構建 SWG label：{盤面尺吋}{盤面Valve接頭}
        // 盤面尺吋從 panelData.size 獲取，盤面Valve接頭從 panelData.valveConnector 獲取
        const branchPanelSize = panelData.size || '';
        // 使用 panelData.valveConnector，確保 "SWG" 也能正確顯示
        const branchValveConnector = panelData.valveConnector !== undefined && panelData.valveConnector !== null
          ? String(panelData.valveConnector)
          : '';
        let swgLabel = '';
        if (branchPanelSize && branchValveConnector) {
          swgLabel = `${branchPanelSize} ${branchValveConnector}`;
        } else if (branchPanelSize) {
          swgLabel = branchPanelSize;
        } else if (branchValveConnector) {
          swgLabel = branchValveConnector;
        } else {
          swgLabel = 'SWG';
        }

        branches.push({
          swgLabel: swgLabel,
          chillerLines: chillerLines.length > 0 ? chillerLines : ['設備資訊'],
          pipelineLabel: branchPipelineLabel,
          hasValve: hasBranchValve,  // 記錄是否有閥件
          valveType: panelEquipmentValveData.valveType || '',  // 閥件種類
          valveSize: panelEquipmentValveData.size || '',  // 閥件尺寸
          valveConnector: panelEquipmentValveData.connectorType || '',  // 閥件接頭
          branchIndex: branchIndex  // 保存原始分支索引，以便匹配 branchModulesData
        });
      }

      // 提取該分支的額外盤面數據（除了第一個群組之外的其他群組）
      const branchManifoldPanelBranches = [];
      if (branchPanelGroups.length > 1) {
        // 從第二個群組開始（索引1開始）
        branchPanelGroups.slice(1).forEach((group, manifoldIndex) => {
          const panel = group.panel || {};
          const panelData = panel.data || {};
          const equipment = group.equipment || {};
          const equipmentData = equipment.data || {};

          const chillerLines = buildEquipmentLines(equipmentData, panelData, {
            index: branchIndex * 100 + manifoldIndex + 1, // 使用分支索引避免衝突
            sourceGasType: sourceGasType
          });

          // 檢查盤面分支設備是否有閥件
          const manifoldValve = group.valve || {};
          const manifoldValveData = manifoldValve.data || {};
          const hasManifoldValve = !!(manifoldValveData && Object.keys(manifoldValveData).length > 0);

          // 構建 SWG label：{盤面尺吋}{盤面Valve接頭}
          const branchManifoldPanelSize = panelData.size || '';
          // 使用 panelData.valveConnector，確保 "SWG" 也能正確顯示
          const branchManifoldValveConnector = panelData.valveConnector !== undefined && panelData.valveConnector !== null
            ? String(panelData.valveConnector)
            : '';
          let branchManifoldSwgLabel = '';
          if (branchManifoldPanelSize && branchManifoldValveConnector) {
            branchManifoldSwgLabel = `${branchManifoldPanelSize} ${branchManifoldValveConnector}`;
          } else if (branchManifoldPanelSize) {
            branchManifoldSwgLabel = branchManifoldPanelSize;
          } else if (branchManifoldValveConnector) {
            branchManifoldSwgLabel = branchManifoldValveConnector;
          } else {
            branchManifoldSwgLabel = 'SWG';
          }

          branchManifoldPanelBranches.push({
            chillerLines: chillerLines.length > 0 ? chillerLines : ['設備資訊'],
            swgLabel: branchManifoldSwgLabel,
            hasValve: hasManifoldValve,
            valveType: manifoldValveData.valveType || '',
            valveSize: manifoldValveData.size || '',
            valveConnector: manifoldValveData.connectorType || '',
            panel: panelData, // 保存 panel 數據以便後續使用
            valve: manifoldValveData // 保存 valve 數據以便後續使用
          });
        });
      }

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
        }),
        manifoldPanelBranches: branchManifoldPanelBranches // 添加額外盤面數據
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
  // 排除設備閥件分支（有 branchValve 但沒有 panel 的群組）
  const mainPanelGroups = panelEquipmentGroups || [];
  const manifoldPanelBranches = [];
  if (mainPanelGroups.length > 1) {
    // 從第二個群組開始（索引1開始），過濾掉設備閥件分支
    mainPanelGroups.slice(1).forEach((group, index) => {
      // 排除設備閥件分支：有 branchValve 但沒有 panel 的群組
      const hasBranchValve = !!(group.branchValve && group.branchValve.data && Object.keys(group.branchValve.data).length > 0);
      const hasPanel = !!(group.panel && group.panel.data && Object.keys(group.panel.data).length > 0);
      const isEquipmentValveBranch = hasBranchValve && !hasPanel;
      
      // 如果是設備閥件分支，跳過
      if (isEquipmentValveBranch) {
        return;
      }
      
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

      // 構建 SWG label：{盤面尺吋}{盤面Valve接頭}
      const manifoldPanelSize = panelData.size || '';
      // 使用 panelData.valveConnector，確保 "SWG" 也能正確顯示
      const manifoldValveConnector = panelData.valveConnector !== undefined && panelData.valveConnector !== null
        ? String(panelData.valveConnector)
        : '';
      let manifoldSwgLabel = '';
      if (manifoldPanelSize && manifoldValveConnector) {
        manifoldSwgLabel = `${manifoldPanelSize} ${manifoldValveConnector}`;
      } else if (manifoldPanelSize) {
        manifoldSwgLabel = manifoldPanelSize;
      } else if (manifoldValveConnector) {
        manifoldSwgLabel = manifoldValveConnector;
      } else {
        manifoldSwgLabel = 'SWG';
      }

      manifoldPanelBranches.push({
        chillerLines: chillerLines.length > 0 ? chillerLines : ['設備資訊'],
        swgLabel: manifoldSwgLabel,
        hasValve: hasManifoldValve,  // 記錄是否有閥件
        valveType: manifoldValveData.valveType || '',  // 閥件種類
        valveSize: manifoldValveData.size || '',  // 閥件尺寸
        valveConnector: manifoldValveData.connectorType || '',  // 閥件接頭
        additionalEquipmentBranches: (group.additionalEquipmentCards || []).map((equipmentCard) => {
          const equipmentData = equipmentCard?.data || {};
          const valveData = equipmentCard?.valve?.data || {};

          // 構建設備資訊
          const equipmentLines = buildEquipmentLines(equipmentData, {}, { sourceGasType: sourceGasType });

          // 檢查設備分支是否有閥件
          const equipmentValve = equipmentCard?.valve || {};
          const equipmentValveData = equipmentValve.data || {};
          const hasEquipmentValve = !!(equipmentValveData && Object.keys(equipmentValveData).length > 0);

          return {
            equipmentLines: equipmentLines.length > 0 ? equipmentLines : ['設備資訊'],
            swgLabel: equipmentData.size ? `${equipmentData.size} SWG` : 'SWG',
            hasValve: hasEquipmentValve,  // 記錄是否有閥件
            valveType: equipmentValveData.valveType || '',  // 閥件種類
            valveSize: equipmentValveData.size || '',  // 閥件尺寸
            valveConnector: equipmentValveData.connectorType || ''  // 閥件接頭
          };
        })
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

  // 提取設備閥件分支數據（從 panelEquipmentGroups 中查找有 branchValve 的群組）
  // 這些分支從設備閥件（panel 和 equipment 之間的閥件）的左側往下繪製
  // 包括主設備和額外設備的設備閥件分支
  const equipmentValveBranches = [];
  const mainPanelGroup = panelEquipmentGroups[0];
  if (mainPanelGroup) {
    // 查找主分支中所有有 branchValve 的群組
    // 設備閥件分支必須有 branchValve 且沒有 panel（或 panel 為 null），以區分於盤面分支
    panelEquipmentGroups.forEach((group, groupIndex) => {
      // 檢查是否是設備閥件分支：
      // 1. 必須有 branchValve 屬性
      // 2. 不能有 panel 屬性（或 panel 為 null），以區分於盤面分支
      // 3. parentGroupId 指向主群組，或者 parentAdditionalEquipmentId 指向某個額外設備卡片
      const hasBranchValve = !!(group.branchValve && group.branchValve.data && Object.keys(group.branchValve.data).length > 0);
      const hasPanel = !!(group.panel && group.panel.data && Object.keys(group.panel.data).length > 0);
      const isEquipmentValveBranch = hasBranchValve && !hasPanel;
      
      if (isEquipmentValveBranch) {
        // 檢查是否屬於主分支的設備閥件分支
        const isMainBranchEquipmentValveBranch = 
          (group.parentGroupId === mainPanelGroup.id) || 
          (group.parentAdditionalEquipmentId && mainPanelGroup.additionalEquipmentCards && 
           mainPanelGroup.additionalEquipmentCards.some(card => card.id === group.parentAdditionalEquipmentId));
        
        if (isMainBranchEquipmentValveBranch) {
          const branchValve = group.branchValve || {};
          const branchValveData = branchValve.data || {};
          
          const equipment = group.equipment || {};
          const equipmentData = equipment.data || {};
          
          // 構建設備資訊
          const equipmentLines = buildEquipmentLines(equipmentData, {}, { sourceGasType: sourceGasType });
          
          // 檢查是否啟用（enableValve）
          const enableValve = branchValveData.enableValve === true;
          
          // 判斷是主設備還是額外設備的設備閥件分支
          const isMainEquipmentBranch = !group.parentAdditionalEquipmentId;
          const equipmentIndex = isMainEquipmentBranch ? 0 : 
            (mainPanelGroup.additionalEquipmentCards?.findIndex(card => card.id === group.parentAdditionalEquipmentId) ?? -1);
          
          equipmentValveBranches.push({
            groupIndex: 0,  // 主分支的索引始終為 0
            equipmentIndex: isMainEquipmentBranch ? 0 : equipmentIndex + 1,  // 0 表示主設備，>0 表示額外設備索引
            isMainEquipment: isMainEquipmentBranch,
            branchValve: {
              valveType: branchValveData.valveType || '',
              valveSize: branchValveData.size || '',
              valveConnector: branchValveData.connectorType || '',
              branchSize: branchValveData.branchSize || '',  // 連結分支尺寸
              enableValve: enableValve,
              backPipelineType: branchValveData.backPipelineType || sourcePipelineType
            },
            equipment: {
              lines: equipmentLines.length > 0 ? equipmentLines : ['設備資訊'],
              data: equipmentData
            }
          });
        }
      }
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
    equipmentBranches,       // 設備分支數據
    equipmentValveBranches   // 設備閥件分支數據（從設備閥件左側往下繪製）
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

  // 計算源頭資訊框的實際高度（根據內容自適應）
  const sourceLineHeight = 30;
  const sourceVerticalPadding = 40;
  const minSourceBlockHeight = 100;
  const actualSourceBlockHeight = Math.max(minSourceBlockHeight, moduleData.sourceLines.length * sourceLineHeight + sourceVerticalPadding);

  // 記錄模組的底部Y位置，用於計算實際高度
  // 初始值設為源頭資訊框的底部（如果沒有分支源頭資訊卡片）
  let moduleBottomY = sourceY + actualSourceBlockHeight;

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
  ctx.strokeRect(sourceX, sourceY, actualSourceBlockWidth, actualSourceBlockHeight);

  // Calculate text position for vertical centering
  const lineHeight = 30;
  const numLines = moduleData.sourceLines.length;
  const totalTextHeight = numLines * lineHeight;
  // Center the text block vertically: (block height - text height) / 2 + first line offset
  const textStartY = sourceY + (actualSourceBlockHeight - totalTextHeight) / 2 + lineHeight - 5;

  drawTextBlock(ctx, moduleData.sourceLines, sourceX + 15, textStartY, {
    font: FONT_PRIMARY,
    lineHeight: lineHeight
  });

  // 繪製分支源頭資訊卡片（如果有）
  let branchSourceBottomY = sourceY + actualSourceBlockHeight;
  if (moduleData.branchSourceDataList && moduleData.branchSourceDataList.length > 0) {
    const branchSourceSpacing = 20; // 分支源頭資訊卡片與源頭資訊之間的間距
    let currentBranchSourceY = sourceY + actualSourceBlockHeight + branchSourceSpacing;

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

      // 計算分支源頭資訊框的實際高度（根據內容自適應）
      const actualBranchSourceBlockHeight = Math.max(minSourceBlockHeight, branchSource.lines.length * sourceLineHeight + sourceVerticalPadding);

      // 繪製分支源頭資訊框
      ctx.strokeRect(sourceX, currentBranchSourceY, actualBranchSourceBlockWidth, actualBranchSourceBlockHeight);

      // 計算文本位置（垂直居中）
      const branchNumLines = branchSource.lines.length;
      const branchTotalTextHeight = branchNumLines * lineHeight;
      const branchTextStartY = currentBranchSourceY + (actualBranchSourceBlockHeight - branchTotalTextHeight) / 2 + lineHeight - 5;

      drawTextBlock(ctx, branchSource.lines, sourceX + 15, branchTextStartY, {
        font: FONT_PRIMARY,
        lineHeight: lineHeight
      });

      // 繪製連接線：從主管線連接到分支源頭資訊卡片
      // 判斷條件與 App.vue 相同：使用源頭的 pipelineType
      const pipelineType = moduleSet.source?.data?.pipelineType || '單套管';
      const branchSourceCenterY = currentBranchSourceY + actualBranchSourceBlockHeight / 2;
      const connectionStartX = sourceX + actualSourceBlockWidth + 30; // 起點在主源頭卡片右側一些
      const connectionEndX = sourceX + actualBranchSourceBlockWidth; // 終點在分支源頭卡片的右邊
      const mainLineY = sourceY + actualSourceBlockHeight / 2; // 主管線的Y位置

      // 根據管線類型繪製不同樣式的連接線（判斷條件與 App.vue 相同：使用源頭的 pipelineType）
      // 垂直線：從主管線向下到分支源頭資訊卡片
      drawLineByType(ctx, connectionStartX, mainLineY, connectionStartX, branchSourceCenterY, pipelineType, true);
      // 水平線：連接到分支源頭資訊卡片右側
      drawLineByType(ctx, connectionStartX, branchSourceCenterY, connectionEndX, branchSourceCenterY, pipelineType, false);

      currentBranchSourceY += actualBranchSourceBlockHeight + branchSourceSpacing;
      branchSourceBottomY = currentBranchSourceY;
    });
  }

  // Starting point after source block
  let currentX = sourceX + actualSourceBlockWidth;
  const mainY = sourceY + actualSourceBlockHeight / 2;

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

  // 計算主管線的管線資訊和樓層資訊的固定x位置，確保不與閥件重疊
  // 管線資訊位置：在閥件區域結束後，確保有足夠間距（考慮閥件標籤的寬度）
  const PIPELINE_LABEL_OFFSET = 300; // 管線資訊距離閥件區域的距離
  const FLOOR_LABEL_OFFSET = 100; // 樓層資訊距離管線資訊的距離（減小以讓樓層更靠右，避免與主閥件重疊）
  const mainPipelineLabelX = afterValvesX + PIPELINE_LABEL_OFFSET;
  const mainFloorLabelX = mainPipelineLabelX - FLOOR_LABEL_OFFSET;

  const unifiedLabelX = mainPipelineLabelX; // 保持向後兼容

  // 追蹤所有分支的底部位置，用於計算模組實際高度
  const branchBottomPositions = [];
  // 追蹤已繪製的分支 Y 位置和底部位置，用於確保源頭閥件分支不重疊
  const drawnBranchPositions = [];
  const BRANCH_SPACING = 160; // 分支之間的間距（源頭閥件模組分支與分支之間）

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

          // 計算分支的 Y 位置，確保不重疊並依序往下排列
          // 1. 先計算從閥件底部開始的最小位置
          const minYFromValve = valvePos.y + 30;

          // 2. 計算基於之前已繪製分支的最大底部位置
          let maxPreviousBottom = 0;
          if (drawnBranchPositions.length > 0) {
            maxPreviousBottom = Math.max(...drawnBranchPositions.map(p => p.bottomY)) + 20;
          }

          // 3. 如果沒有已繪製的分支，使用主分支的底部或盤面分支的底部
          if (maxPreviousBottom === 0) {
            const manifoldBottom = ctx.canvas._manifoldBottomY;
            const mainPanelEquipmentBottom = ctx.canvas._mainPanelAdditionalEquipmentBottom;
            const equipmentValveBranchesBottom = ctx.canvas._equipmentValveBranchesBottom;

            // 取所有可能的底部位置的最大值（包括設備閥件分支的底部）
            const bottoms = [mainY + BOX_HEIGHT / 2 + 100]; // 基礎底部
            if (manifoldBottom) bottoms.push(manifoldBottom);
            if (mainPanelEquipmentBottom) bottoms.push(mainPanelEquipmentBottom);
            if (equipmentValveBranchesBottom) bottoms.push(equipmentValveBranchesBottom); // 考慮設備閥件分支的底部

            maxPreviousBottom = Math.max(...bottoms);
          }

          // 4. 計算新分支的 Y 位置：從最大底部位置 + 間距開始，但至少要在閥件下方
          branchY = Math.max(minYFromValve, maxPreviousBottom + BRANCH_SPACING);

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
        ctx.fillText(branch.pipelineLabel, mainPipelineLabelX - 40, branchY - 12);

        beforeVertLineX = mainFloorLabelX;

        drawLineByType(ctx, labelAreaEndX, branchY, beforeVertLineX, branchY, sourcePipelineType, false);
      } else {
        // 沒有閥件數據時，主分支不繪製 check valve（使用源頭的管線類型）
        // 確保從源頭到主要盤面的線條連續，中間不可以有空白
        const labelAreaEndX = branchStartX + 400;

        drawLineByType(ctx, branchStartX, branchY, labelAreaEndX, branchY, sourcePipelineType, false);

        ctx.font = FONT_SECONDARY;
        ctx.fillStyle = '#1f1f1f';
        ctx.fillText(branch.pipelineLabel, mainPipelineLabelX - 40, branchY - 12);

        beforeVertLineX = mainFloorLabelX;

        // 從 labelAreaEndX 到 mainFloorLabelX 的線條
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

        // 繪製設備閥件分支（從設備閥件左側往下繪製）
        // 查找對應的設備閥件分支數據（主設備的設備閥件分支）
        const equipmentValveBranches = moduleData.equipmentValveBranches || [];
        const mainEquipmentValveBranches = equipmentValveBranches.filter(evb => evb.groupIndex === index && evb.isMainEquipment);
        
        if (mainEquipmentValveBranches.length > 0) {
          const EQUIPMENT_VALVE_BRANCH_SPACING = 120; // 設備閥件分支間距
          const VALVE_LEFT_OFFSET = 80; // 從閥件左側的偏移距離
          const branchStartX = valveCenterX - valveSize / 2 - VALVE_LEFT_OFFSET; // 分支起始X位置（閥件左側）
          
          // 追蹤已繪製的分支底部位置
          let currentBranchY = branchY;
          const drawnEquipmentValveBranchPositions = [];
          
          mainEquipmentValveBranches.forEach((equipmentValveBranch, branchIdx) => {
            const branchValveData = equipmentValveBranch.branchValve || {};
            const enableValve = branchValveData.enableValve === true;
            
            // 計算分支的Y位置（參考源頭閥件分支的樣式）
            if (branchIdx === 0) {
              // 第一個分支：從閥件下方開始（類似源頭閥件分支從主管線往下）
              const topVertLineLength = 80;  // 與源頭閥件分支一致
              currentBranchY = branchY + topVertLineLength;
            } else {
              // 後續分支：從前一個分支底部開始
              const prevBranchBottom = drawnEquipmentValveBranchPositions[branchIdx - 1]?.bottomY || currentBranchY;
              const topVertLineLength = 80;  // 與源頭閥件分支一致
              currentBranchY = prevBranchBottom + topVertLineLength;
            }
            
            // 繪製從閥件位置往下的垂直線（使用源頭的管線類型，參考源頭閥件分支）
            const topVertLineLength = 80;  // 與源頭閥件分支一致
            const valveTopY = branchY + topVertLineLength;
            drawLineByType(ctx, branchStartX, branchY, branchStartX, valveTopY, sourcePipelineType, true);
            
            const sizeLabel = branchValveData.branchSize || '';
            const label = branchValveData.valveSize || '';  // 使用閥件尺寸作為標籤（類似源頭閥件分支的 valveLabels）
            
            // Size label above valve position (類似源頭閥件分支在主管線上方的標籤)
            if (sizeLabel) {
              ctx.font = FONT_SMALL;
              ctx.fillStyle = '#1f1f1f';
              ctx.textAlign = 'center';
              ctx.fillText(sizeLabel, branchStartX, branchY - 8);
              ctx.textAlign = 'left';
            }
            
            // Pipe size label next to top vertical line (rotated) (類似源頭閥件分支在垂直線右側的標籤)
            if (label) {
              ctx.font = FONT_SMALL;
              ctx.fillStyle = '#1f1f1f';
              ctx.textAlign = 'center';
              ctx.save();
              ctx.translate(branchStartX + 25, branchY + topVertLineLength / 2);
              ctx.rotate(-Math.PI / 2);
              ctx.fillText(label, 0, 0);
              ctx.restore();
              ctx.textAlign = 'left';
            }
            
            // Draw valve symbol (vertical orientation) (類似源頭閥件分支)
            const branchValveSize = VALVE_SIZE;
            const branchValveCenterY = valveTopY + branchValveSize / 2 + 5;  // 與源頭閥件分支一致
            
            // 繪製垂直閥件符號
            const branchValveInfo = {
              valveType: branchValveData.valveType || '',
              valveSize: branchValveData.valveSize || '',
              valveConnector: branchValveData.valveConnector || ''
            };
            drawValveSymbol(ctx, branchStartX, branchValveCenterY, branchValveSize, null, label, true, branchValveInfo);
            
            // Add label to the right of valve (rotated) (類似源頭閥件分支在閥件右側的標籤)
            const valveSize = branchValveData.valveSize || '';
            const valveConnector = branchValveData.valveConnector || '';
            const valveType = branchValveData.valveType || '';
            
            ctx.fillStyle = '#1f1f1f';
            ctx.textAlign = 'center';
            ctx.save();
            ctx.translate(branchStartX + branchValveSize / 2 + 15, branchValveCenterY);  // 與源頭閥件分支一致
            ctx.rotate(-Math.PI / 2);
            
            // 第一行：{閥件尺寸}{閥件接頭}（尺寸與接頭之間要有空白）
            ctx.font = FONT_SMALL_ROTATED;
            const firstLine = [valveSize, valveConnector].filter(Boolean).join(' ');  // 使用空格連接
            if (firstLine) {
              ctx.fillText(firstLine, 0, -8);  // 向上偏移8px
            }
            
            // 第二行：{閥件種類}（使用更小的字體）
            if (valveType && valveType !== 'NA') {
              ctx.font = '14px "Microsoft JhengHei", "微軟正黑體", Arial';  // 比 FONT_SMALL_ROTATED (16px) 更小
              ctx.fillText(valveType, 0, 8);  // 向下偏移8px
            }
            
            ctx.restore();
            ctx.textAlign = 'left';
            
            let branchBottomY = branchValveCenterY + branchValveSize / 2;
            
            // 如果啟用，繼續往下往右連接到設備卡片
            if (enableValve) {
              const bottomVertLineLength = 40;
              const bottomVertLineStartY = branchValveCenterY + branchValveSize / 2;
              const bottomVertLineEndY = bottomVertLineStartY + bottomVertLineLength;
              
              // 繪製從閥件往下的垂直線（使用分支閥件的 backPipelineType）
              const branchValveBackPipelineType = branchValveData.backPipelineType || sourcePipelineType;
              drawLineByType(ctx, branchStartX, bottomVertLineStartY, branchStartX, bottomVertLineEndY, branchValveBackPipelineType, true);
              
              // 繪製水平線連接到設備卡片
              const equipmentCardX = chillerBoxLeftX;
              const horizontalLineY = bottomVertLineEndY;
              
              // 水平線（使用分支閥件的 backPipelineType）
              drawLineByType(ctx, branchStartX, horizontalLineY, equipmentCardX, horizontalLineY, branchValveBackPipelineType, false);
              
              // 繪製設備卡片
              const equipmentLines = equipmentValveBranch.equipment.lines || ['設備資訊'];
              const lineHeight = 26;
              const actualEquipmentHeight = calculateEquipmentBoxHeight(
                ctx,
                equipmentLines,
                CHILLER_BOX_WIDTH,
                lineHeight,
                FONT_SECONDARY,
                BOX_HEIGHT
              );
              
              const equipmentTop = horizontalLineY - actualEquipmentHeight / 2;
              ctx.strokeRect(equipmentCardX, equipmentTop, CHILLER_BOX_WIDTH, actualEquipmentHeight);
              
              const equipmentTextStartY = equipmentTop + lineHeight + 10;
              drawTextBlock(ctx, equipmentLines, equipmentCardX + 15, equipmentTextStartY, {
                font: FONT_SECONDARY,
                lineHeight: lineHeight,
                maxWidth: CHILLER_BOX_WIDTH - 30
              });
              
              branchBottomY = equipmentTop + actualEquipmentHeight;
            }
            
            // 記錄分支底部位置
            drawnEquipmentValveBranchPositions.push({
              bottomY: branchBottomY
            });
          });
          
          // 更新模組底部位置（考慮設備閥件分支的高度）
          if (drawnEquipmentValveBranchPositions.length > 0) {
            const lastBranchBottom = drawnEquipmentValveBranchPositions[drawnEquipmentValveBranchPositions.length - 1].bottomY;
            if (lastBranchBottom > moduleBottomY) {
              moduleBottomY = lastBranchBottom;
            }
            
            // 將設備閥件分支的底部位置存儲到 canvas，供後續分支使用
            ctx.canvas._equipmentValveBranchesBottom = lastBranchBottom;
          }
        }

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

    // 繪製主盤面的額外設備分支（從 SWG box 後方往下分支）
    // 只在主盤面（index === 0）時繪製，類似額外盤面的繪製方式
    if (index === 0) {
      const mainPanelGroup = moduleSet.panelEquipmentGroups?.[0] || null;
      const mainAdditionalEquipmentCards = mainPanelGroup?.additionalEquipmentCards
        ? (Array.isArray(mainPanelGroup.additionalEquipmentCards)
          ? mainPanelGroup.additionalEquipmentCards
          : [])
        : [];

      if (mainAdditionalEquipmentCards.length > 0) {
        const equipmentBaseX = firstBoxRightX + 30;
        const equipmentBranchSpacing = 120;  // 額外設備分支間距（減小以更緊湊）

        // 計算額外設備的起始Y位置：如果有設備閥件分支，從其底部開始
        const equipmentValveBranchesBottom = ctx.canvas._equipmentValveBranchesBottom;
        const baseY = equipmentValveBranchesBottom ? equipmentValveBranchesBottom + 20 : branchY; // 如果有設備閥件分支，從其底部 + 間距開始

        // 計算額外設備的Y位置
        const numEquipmentBranches = mainAdditionalEquipmentCards.length;
        const equipmentYPositions = [];
        for (let i = 0; i < numEquipmentBranches; i++) {
          if (i === 0) {
            // 第一個額外設備：從 baseY 開始
            equipmentYPositions.push(baseY + equipmentBranchSpacing);
          } else {
            // 後續額外設備：從前一個設備位置 + 間距
            equipmentYPositions.push(equipmentYPositions[i - 1] + equipmentBranchSpacing);
          }
        }

        // 獲取主盤面的管線類型
        const mainPanelData = mainPanelGroup?.panel?.data || {};
        const mainPanelBackPipelineType = mainPanelData.backPipelineType || sourcePipelineType;

        equipmentYPositions.forEach((equipY, equipBranchIdx) => {
          const additionalCard = mainAdditionalEquipmentCards[equipBranchIdx];
          if (!additionalCard) return;

          // 找出連接到此設備的線條（反向映射）
          const equipLineIdx = equipBranchIdx === 0 ? 1 : 0;  // 反向映射

          // 垂直線的起始Y位置：如果有設備閥件分支，從其底部開始；否則從 branchY 開始
          const equipmentValveBranchesBottom = ctx.canvas._equipmentValveBranchesBottom;
          const equipStartY = equipmentValveBranchesBottom ? equipmentValveBranchesBottom : branchY;
          const equipLineOffsetX = equipLineIdx * 20;
          const equipLineStartX = equipmentBaseX + equipLineOffsetX;

          // 獲取設備分支的管線類型（使用閥件的 backPipelineType）
          const additionalValveData = additionalCard?.valve?.data || {};
          const equipmentPipelineType = additionalValveData.backPipelineType || mainPanelBackPipelineType;

          // 繪製垂直線（使用設備分支的管線類型）
          drawLineByType(ctx, equipLineStartX, equipStartY, equipLineStartX, equipY, equipmentPipelineType, true);

          // 繪製水平線（使用設備分支的管線類型）
          const equipLineEndX = equipLineStartX + 50;
          drawLineByType(ctx, equipLineStartX, equipY, equipLineEndX, equipY, equipmentPipelineType, false);

          // 構建額外設備資訊
          const additionalData = additionalCard?.data || {};
          const additionalLines = buildEquipmentLines(additionalData, {}, { sourceGasType: sourceGasType });

          // 計算額外設備卡片高度
          const lineHeight = 26;
          const actualAdditionalHeight = calculateEquipmentBoxHeight(
            ctx,
            additionalLines,
            CHILLER_BOX_WIDTH,
            lineHeight,
            FONT_SECONDARY,
            BOX_HEIGHT
          );

          // 如果有額外設備閥件，繪製閥件
          // 使用與主管線模式相同的檢查方式：檢查對象是否有任何鍵
          const hasAdditionalValve = !!(additionalValveData && Object.keys(additionalValveData).length > 0);
          if (hasAdditionalValve) {
            const additionalValveSize = 50;
            const additionalValveCenterX = chillerBoxLeftX - additionalValveSize / 2 - 70;

            // 連接線：從水平線到閥件
            drawLineByType(ctx, equipLineEndX, equipY, additionalValveCenterX - additionalValveSize / 2 - 10, equipY, equipmentPipelineType, false);

            // 繪製閥件
            const additionalValveInfo = {
              valveType: additionalValveData.valveType || '',
              valveSize: additionalValveData.size || '',
              valveConnector: additionalValveData.connectorType || ''
            };
            drawValveSymbol(ctx, additionalValveCenterX, equipY, additionalValveSize, '1/4"', null, false, additionalValveInfo);

            // 連接線：從閥件到設備（使用閥件的 backPipelineType）
            const additionalValveBackPipelineType = additionalValveData.backPipelineType || equipmentPipelineType;
            drawLineByType(ctx, additionalValveCenterX + additionalValveSize / 2 + 10, equipY, chillerBoxLeftX, equipY, additionalValveBackPipelineType, false);
            
            // 繪製額外設備的設備閥件分支（從額外設備閥件左側往下繪製）
            const equipmentValveBranches = moduleData.equipmentValveBranches || [];
            const additionalEquipmentValveBranches = equipmentValveBranches.filter(evb => 
              evb.groupIndex === index && 
              !evb.isMainEquipment && 
              evb.equipmentIndex === equipBranchIdx + 1
            );
            
            if (additionalEquipmentValveBranches.length > 0) {
              const EQUIPMENT_VALVE_BRANCH_SPACING = 120; // 設備閥件分支間距
              const VALVE_LEFT_OFFSET = 80; // 從閥件左側的偏移距離
              const additionalBranchStartX = additionalValveCenterX - additionalValveSize / 2 - VALVE_LEFT_OFFSET;
              
              let currentAdditionalBranchY = equipY;
              const drawnAdditionalEquipmentValveBranchPositions = [];
              
              additionalEquipmentValveBranches.forEach((equipmentValveBranch, branchIdx) => {
                const branchValveData = equipmentValveBranch.branchValve || {};
                const enableValve = branchValveData.enableValve === true;
                
                // 計算分支的Y位置（參考源頭閥件分支的樣式）
                if (branchIdx === 0) {
                  // 第一個分支：從閥件下方開始（類似源頭閥件分支從主管線往下）
                  const topVertLineLength = 80;  // 與源頭閥件分支一致
                  currentAdditionalBranchY = equipY + topVertLineLength;
                } else {
                  // 後續分支：從前一個分支底部開始
                  const prevBranchBottom = drawnAdditionalEquipmentValveBranchPositions[branchIdx - 1]?.bottomY || currentAdditionalBranchY;
                  const topVertLineLength = 80;  // 與源頭閥件分支一致
                  currentAdditionalBranchY = prevBranchBottom + topVertLineLength;
                }
                
                // 繪製從閥件位置往下的垂直線（使用源頭的管線類型，參考源頭閥件分支）
                const topVertLineLength = 80;  // 與源頭閥件分支一致
                const valveTopY = equipY + topVertLineLength;
                drawLineByType(ctx, additionalBranchStartX, equipY, additionalBranchStartX, valveTopY, equipmentPipelineType, true);
                
                const sizeLabel = branchValveData.branchSize || '';
                const label = branchValveData.valveSize || '';  // 使用閥件尺寸作為標籤（類似源頭閥件分支的 valveLabels）
                
                // Size label above valve position (類似源頭閥件分支在主管線上方的標籤)
                if (sizeLabel) {
                  ctx.font = FONT_SMALL;
                  ctx.fillStyle = '#1f1f1f';
                  ctx.textAlign = 'center';
                  ctx.fillText(sizeLabel, additionalBranchStartX, equipY - 8);
                  ctx.textAlign = 'left';
                }
                
                // Pipe size label next to top vertical line (rotated) (類似源頭閥件分支在垂直線右側的標籤)
                if (label) {
                  ctx.font = FONT_SMALL;
                  ctx.fillStyle = '#1f1f1f';
                  ctx.textAlign = 'center';
                  ctx.save();
                  ctx.translate(additionalBranchStartX + 25, equipY + topVertLineLength / 2);
                  ctx.rotate(-Math.PI / 2);
                  ctx.fillText(label, 0, 0);
                  ctx.restore();
                  ctx.textAlign = 'left';
                }
                
                // Draw valve symbol (vertical orientation) (類似源頭閥件分支)
                const branchValveSize = VALVE_SIZE;
                const branchValveCenterY = valveTopY + branchValveSize / 2 + 5;  // 與源頭閥件分支一致
                
                // 繪製垂直閥件符號
                const branchValveInfo = {
                  valveType: branchValveData.valveType || '',
                  valveSize: branchValveData.valveSize || '',
                  valveConnector: branchValveData.valveConnector || ''
                };
                drawValveSymbol(ctx, additionalBranchStartX, branchValveCenterY, branchValveSize, null, label, true, branchValveInfo);
                
                // Add label to the right of valve (rotated) (類似源頭閥件分支在閥件右側的標籤)
                const valveSize = branchValveData.valveSize || '';
                const valveConnector = branchValveData.valveConnector || '';
                const valveType = branchValveData.valveType || '';
                
                ctx.fillStyle = '#1f1f1f';
                ctx.textAlign = 'center';
                ctx.save();
                ctx.translate(additionalBranchStartX + branchValveSize / 2 + 15, branchValveCenterY);  // 與源頭閥件分支一致
                ctx.rotate(-Math.PI / 2);
                
                // 第一行：{閥件尺寸}{閥件接頭}（尺寸與接頭之間要有空白）
                ctx.font = FONT_SMALL_ROTATED;
                const firstLine = [valveSize, valveConnector].filter(Boolean).join(' ');  // 使用空格連接
                if (firstLine) {
                  ctx.fillText(firstLine, 0, -8);  // 向上偏移8px
                }
                
                // 第二行：{閥件種類}（使用更小的字體）
                if (valveType && valveType !== 'NA') {
                  ctx.font = '14px "Microsoft JhengHei", "微軟正黑體", Arial';  // 比 FONT_SMALL_ROTATED (16px) 更小
                  ctx.fillText(valveType, 0, 8);  // 向下偏移8px
                }
                
                ctx.restore();
                ctx.textAlign = 'left';
                
                let branchBottomY = branchValveCenterY + branchValveSize / 2;
                
                // 如果啟用，繼續往下往右連接到設備卡片
                if (enableValve) {
                  const bottomVertLineLength = 40;
                  const bottomVertLineStartY = branchValveCenterY + branchValveSize / 2;
                  const bottomVertLineEndY = bottomVertLineStartY + bottomVertLineLength;
                  
                  const branchValveBackPipelineType = branchValveData.backPipelineType || equipmentPipelineType;
                  drawLineByType(ctx, additionalBranchStartX, bottomVertLineStartY, additionalBranchStartX, bottomVertLineEndY, branchValveBackPipelineType, true);
                  
                  const equipmentCardX = chillerBoxLeftX;
                  const horizontalLineY = bottomVertLineEndY;
                  
                  drawLineByType(ctx, additionalBranchStartX, horizontalLineY, equipmentCardX, horizontalLineY, branchValveBackPipelineType, false);
                  
                  // 繪製設備卡片
                  const equipmentLines = equipmentValveBranch.equipment.lines || ['設備資訊'];
                  const lineHeight = 26;
                  const actualEquipmentHeight = calculateEquipmentBoxHeight(
                    ctx,
                    equipmentLines,
                    CHILLER_BOX_WIDTH,
                    lineHeight,
                    FONT_SECONDARY,
                    BOX_HEIGHT
                  );
                  
                  const equipmentTop = horizontalLineY - actualEquipmentHeight / 2;
                  ctx.strokeRect(equipmentCardX, equipmentTop, CHILLER_BOX_WIDTH, actualEquipmentHeight);
                  
                  const equipmentTextStartY = equipmentTop + lineHeight + 10;
                  drawTextBlock(ctx, equipmentLines, equipmentCardX + 15, equipmentTextStartY, {
                    font: FONT_SECONDARY,
                    lineHeight: lineHeight,
                    maxWidth: CHILLER_BOX_WIDTH - 30
                  });
                  
                  branchBottomY = equipmentTop + actualEquipmentHeight;
                }
                
                drawnAdditionalEquipmentValveBranchPositions.push({
                  bottomY: branchBottomY
                });
              });
              
              // 更新設備閥件分支的底部位置（取所有設備閥件分支的最大底部）
              if (drawnAdditionalEquipmentValveBranchPositions.length > 0) {
                const lastAdditionalBranchBottom = drawnAdditionalEquipmentValveBranchPositions[drawnAdditionalEquipmentValveBranchPositions.length - 1].bottomY;
                const currentEquipmentValveBranchesBottom = ctx.canvas._equipmentValveBranchesBottom || 0;
                ctx.canvas._equipmentValveBranchesBottom = Math.max(currentEquipmentValveBranchesBottom, lastAdditionalBranchBottom);
              }
            }
          } else {
            // 沒有閥件時，直接從水平線連接到設備
            drawLineByType(ctx, equipLineEndX, equipY, chillerBoxLeftX, equipY, equipmentPipelineType, false);
          }

          // 繪製額外設備卡片
          const additionalTop = equipY - actualAdditionalHeight / 2;
          ctx.strokeRect(chillerBoxLeftX, additionalTop, CHILLER_BOX_WIDTH, actualAdditionalHeight);
          const additionalTextStartY = additionalTop + lineHeight + 10;
          drawTextBlock(ctx, additionalLines, chillerBoxLeftX + 15, additionalTextStartY, {
            font: FONT_SECONDARY,
            lineHeight: lineHeight,
            maxWidth: CHILLER_BOX_WIDTH - 30
          });
        });

        // 儲存額外設備的底部位置，稍後在 branchBottom 計算中使用
        const lastEquipmentY = equipmentYPositions[equipmentYPositions.length - 1];
        const lastEquipmentCard = mainAdditionalEquipmentCards[mainAdditionalEquipmentCards.length - 1];
        const lastEquipmentData = lastEquipmentCard?.data || {};
        const lastEquipmentLines = buildEquipmentLines(lastEquipmentData, {}, { sourceGasType: sourceGasType });
        const lastEquipmentHeight = calculateEquipmentBoxHeight(
          ctx,
          lastEquipmentLines,
          CHILLER_BOX_WIDTH,
          26,
          FONT_SECONDARY,
          BOX_HEIGHT
        );
        ctx.canvas._mainPanelAdditionalEquipmentBottom = lastEquipmentY + lastEquipmentHeight / 2 + 20; // 額外設備底部 + 間距
      }
    }


    // 如果有分支模組完整數據（enableValve 為 true），繪製 pipeline、floor 和 panelEquipmentGroups 卡片
    // 當沒有源頭閥件分支時，lineBeforeSWGX 應該從 mainFloorLabelX 開始，確保線條連續
    let lineBeforeSWGX = firstBoxLeftX - 170; // 默認位置
    let vertLineX = lineBeforeSWGX;
    let vertLineBottom = branchY + 50; // 默認值

    if (branchModuleData && index > 0) {
      // 繪製分支模組的 pipeline 和 floor 卡片
      // 對齊主管線的x軸位置
      const branchPipeline = branchModuleData.pipeline || {};
      const branchFloor = branchModuleData.floor || {};

      // 構建 pipeline label
      const branchPipelineLength = branchPipeline.length || '';
      const branchPipelineMaterial = branchPipeline.material || '';
      const branchPipelineLabel = branchPipelineLength && branchPipelineMaterial
        ? `${branchPipelineLength}M ${branchPipelineMaterial}`
        : (branchPipelineLength ? `${branchPipelineLength}M` : '');

      // Pipeline label 位置：對齊主管線的管線資訊x軸
      const pipelineLabelX = mainPipelineLabelX;
      if (branchPipelineLabel) {
        ctx.font = FONT_SECONDARY;
        ctx.fillStyle = '#1f1f1f';
        ctx.fillText(branchPipelineLabel, pipelineLabelX - 40, branchY - 12);
      }

      // Floor labels 位置：對齊主管線的樓層資訊x軸
      vertLineX = mainFloorLabelX;
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
        const panelData = panelGroup.panel || {}; // 獲取 panel 數據
        const panelValveData = panelGroup.valve || {};
        const equipmentData = panelGroup.equipment || {};
        const additionalEquipmentCards = panelGroup.additionalEquipmentCards || [];

        // 獲取盤面的後方管線類型（從 panel 的 backPipelineType 獲取，而不是 valve 的）
        const panelBackPipelineType = panelData.backPipelineType || sourcePipelineType;

        // 計算主設備卡片的位置
        let currentEquipmentX = chillerBoxLeftX;
        let lineBeforeEquipmentX = firstBoxRightX;

        // 如果有 panel 和 equipment 之間的閥件，繪製閥件（與主管線規格一致）
        if (panelValveData && panelValveData.size) {
          const panelValveSize = 50;
          const panelValveCenterX = currentEquipmentX - panelValveSize / 2 - 70; // 與主管線一致：在設備左側
          const panelValveBackPipelineType = panelValveData.backPipelineType || panelBackPipelineType;

          // 連接線：從 SWG 到閥件（使用盤面的 backPipelineType）
          drawLineByType(ctx, firstBoxRightX, branchY, panelValveCenterX - panelValveSize / 2 - 10, branchY, sourcePipelineType, false);

          // 繪製閥件
          const panelValveInfo = {
            valveType: panelValveData.valveType || '',
            valveSize: panelValveData.size || '',
            valveConnector: panelValveData.connectorType || ''
          };
          drawValveSymbol(ctx, panelValveCenterX, branchY, panelValveSize, '1/2"', null, false, panelValveInfo);

          // 連接線：從閥件到設備（使用閥件的 backPipelineType）
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

        // 連接線：從閥件（或 SWG）到主設備（使用閥件的 backPipelineType，如果沒有則使用盤面的 backPipelineType）
        const panelValveBackPipelineType = panelValveData?.backPipelineType || panelBackPipelineType;
        drawLineByType(ctx, lineBeforeEquipmentX, branchY, currentEquipmentX, branchY, panelValveBackPipelineType, false);

        // 繪製主設備卡片
        ctx.strokeRect(currentEquipmentX, mainEquipTop, CHILLER_BOX_WIDTH, actualMainEquipHeight);
        const mainEquipTextStartY = mainEquipTop + lineHeight + 10;
        drawTextBlock(ctx, mainEquipmentLines, currentEquipmentX + 15, mainEquipTextStartY, {
          font: FONT_SECONDARY,
          lineHeight: lineHeight,
          maxWidth: CHILLER_BOX_WIDTH - 30
        });

        // 繪製源頭閥件分支主盤面的額外設備分支
        // 參考主管線模式：從 SWG box 右側分支，而不是主設備右側
        if (additionalEquipmentCards.length > 0) {
          // 分支點設在 SWG box 右側 30px
          const equipmentBaseX = firstBoxRightX + 30;
          const equipmentBranchSpacing = 120;  // 額外設備分支間距

          // 計算額外設備的Y位置
          const numEquipmentBranches = additionalEquipmentCards.length;
          const equipmentYPositions = [];
          for (let i = 0; i < numEquipmentBranches; i++) {
            equipmentYPositions.push(branchY + (i + 1) * equipmentBranchSpacing);
          }

          equipmentYPositions.forEach((equipY, equipBranchIdx) => {
            const additionalCard = additionalEquipmentCards[equipBranchIdx];
            if (!additionalCard) return;

            // 找出連接到此設備的線條（反向映射）
            const equipLineIdx = equipBranchIdx === 0 ? 1 : 0;

            const equipStartY = branchY;
            const equipLineOffsetX = equipLineIdx * 20;
            const equipLineStartX = equipmentBaseX + equipLineOffsetX;

            // 獲取設備閥件數據
            const additionalValveData = additionalCard?.valve || {};

            // 閥件前方的連接線（垂直線、水平線、從水平線到閥件）使用盤面的後方管線類型
            // 只有閥件到設備的連接線才使用閥件的後方管線類型
            // panelBackPipelineType 已在上面定義，從 panel 的 backPipelineType 獲取

            // 繪製垂直線（使用盤面的後方管線類型）
            drawLineByType(ctx, equipLineStartX, equipStartY, equipLineStartX, equipY, panelBackPipelineType, true);

            // 繪製水平線（使用盤面的後方管線類型）
            const equipLineEndX = equipLineStartX + 50;
            drawLineByType(ctx, equipLineStartX, equipY, equipLineEndX, equipY, panelBackPipelineType, false);

            // 構建額外設備資訊
            const additionalData = additionalCard?.data || {};
            const additionalLines = buildEquipmentLines(additionalData, {}, { sourceGasType: sourceGasType });

            // 計算額外設備卡片高度
            const lineHeight = 26;
            const actualAdditionalHeight = calculateEquipmentBoxHeight(
              ctx,
              additionalLines,
              CHILLER_BOX_WIDTH,
              lineHeight,
              FONT_SECONDARY,
              BOX_HEIGHT
            );

            // 如果有額外設備閥件，繪製閥件
            // 使用與主管線模式相同的檢查方式：檢查對象是否有任何鍵
            const hasAdditionalValve = !!(additionalValveData && Object.keys(additionalValveData).length > 0);
            if (hasAdditionalValve) {
              const additionalValveSize = 50;
              const additionalValveCenterX = currentEquipmentX - additionalValveSize / 2 - 70;

              // 連接線：從水平線到閥件（使用盤面的後方管線類型）
              drawLineByType(ctx, equipLineEndX, equipY, additionalValveCenterX - additionalValveSize / 2 - 10, equipY, panelBackPipelineType, false);

              // 繪製閥件
              const additionalValveInfo = {
                valveType: additionalValveData.valveType || '',
                valveSize: additionalValveData.size || '',
                valveConnector: additionalValveData.connectorType || ''
              };
              drawValveSymbol(ctx, additionalValveCenterX, equipY, additionalValveSize, '1/4"', null, false, additionalValveInfo);

              // 連接線：從閥件到設備（使用閥件的 backPipelineType）
              const additionalValveBackPipelineType = additionalValveData.backPipelineType || panelBackPipelineType;
              drawLineByType(ctx, additionalValveCenterX + additionalValveSize / 2 + 10, equipY, currentEquipmentX, equipY, additionalValveBackPipelineType, false);
            } else {
              // 沒有閥件時，直接從水平線連接到設備（使用盤面的後方管線類型）
              drawLineByType(ctx, equipLineEndX, equipY, currentEquipmentX, equipY, panelBackPipelineType, false);
            }

            // 繪製額外設備卡片
            const additionalTop = equipY - actualAdditionalHeight / 2;
            ctx.strokeRect(currentEquipmentX, additionalTop, CHILLER_BOX_WIDTH, actualAdditionalHeight);
            const additionalTextStartY = additionalTop + lineHeight + 10;
            drawTextBlock(ctx, additionalLines, currentEquipmentX + 15, additionalTextStartY, {
              font: FONT_SECONDARY,
              lineHeight: lineHeight,
              maxWidth: CHILLER_BOX_WIDTH - 30
            });
          });

          // 儲存額外設備的底部位置，用於額外盤面的自適應間距計算
          const lastEquipmentY = equipmentYPositions[equipmentYPositions.length - 1];
          ctx.canvas._branchMainPanelAdditionalEquipmentBottom = lastEquipmentY + 100;
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
      // 樓層資訊位置：對齊主管線的樓層資訊x軸（所有分支都使用相同位置）
      vertLineX = mainFloorLabelX;
      const vertLineTop = branchY - 50;
      vertLineBottom = branchY + 50;

      // Vertical line with floor labels（樓層資訊的垂直線始終使用單線，不需要樣式）
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

      // 當沒有源頭閥件分支時，確保從 beforeVertLineX 到 lineBeforeSWGX 的線條連續
      // 如果 beforeVertLineX 和 vertLineX 相同（都是 mainFloorLabelX），則不需要重複繪製
      if (beforeVertLineX !== vertLineX) {
        // Connect to the pipeline（使用源頭的管線類型）
        drawLineByType(ctx, beforeVertLineX, branchY, vertLineX, branchY, sourcePipelineType, false);
      }

      // 當沒有源頭閥件分支時，確保從樓層資訊位置到 SWG 的線條連續
      // lineBeforeSWGX 應該從 vertLineX 開始，確保線條連續，中間不可以有空白
      const actualLineBeforeSWGX = Math.max(vertLineX, lineBeforeSWGX);

      // 從樓層資訊位置到 SWG 的線條（使用源頭的管線類型）
      // 確保從 vertLineX 到 actualLineBeforeSWGX 之間有連續的線條
      if (actualLineBeforeSWGX > vertLineX) {
        drawLineByType(ctx, vertLineX, branchY, actualLineBeforeSWGX, branchY, sourcePipelineType, false);
      }

      // Line before SWG（使用源頭的管線類型）
      drawLineByType(ctx, actualLineBeforeSWGX, branchY, firstBoxLeftX, branchY, sourcePipelineType, false);
    }

    // 記錄分支的底部位置（設備卡片底部或垂直線底部）
    let branchBottom;
    if (branchModuleData && index > 0 && branchModuleData.panelEquipmentGroups && branchModuleData.panelEquipmentGroups.length > 0) {
      // 對於有分支模組完整數據的情況，需要考慮主設備和額外設備的高度
      const panelGroup = branchModuleData.panelEquipmentGroups[0];
      const equipmentData = panelGroup.equipment || {};
      const additionalEquipmentCards = panelGroup.additionalEquipmentCards || [];

      // 重新計算主設備高度（因為 actualMainEquipHeight 可能不在作用域內）
      const mainEquipmentLines = buildEquipmentLines(equipmentData, {}, { sourceGasType: sourceGasType });
      const mainEquipHeight = calculateEquipmentBoxHeight(
        ctx,
        mainEquipmentLines,
        CHILLER_BOX_WIDTH,
        lineHeight,
        FONT_SECONDARY,
        BOX_HEIGHT
      );
      const mainEquipTop = branchY - mainEquipHeight / 2;
      const mainEquipBottom = mainEquipTop + mainEquipHeight;

      // 如果有額外設備，計算最右側額外設備的底部
      let maxAdditionalBottom = mainEquipBottom;
      if (additionalEquipmentCards.length > 0) {
        // 使用已儲存的額外設備底部位置（如果有的話）
        if (ctx.canvas._branchMainPanelAdditionalEquipmentBottom) {
          maxAdditionalBottom = ctx.canvas._branchMainPanelAdditionalEquipmentBottom;
        } else {
          // 估算：branchY + (N) * 120 + height/2
          const lastIndex = additionalEquipmentCards.length - 1;
          const lastY = branchY + (lastIndex + 1) * 120;
          // 簡單估算高度為 100
          maxAdditionalBottom = lastY + 50;
        }
      }

      branchBottom = Math.max(
        maxAdditionalBottom,
        vertLineBottom  // 垂直線的底部
      );
    } else {
      // 對於沒有分支模組完整數據的情況，使用原來的計算方式
      branchBottom = Math.max(
        boxTop + actualBoxHeight,
        vertLineBottom  // 垂直線的底部
      );

      // 如果主盤面有額外設備分支或設備閥件分支，也要考慮其底部位置
      if (index === 0) {
        const equipmentValveBranchesBottom = ctx.canvas._equipmentValveBranchesBottom;
        const mainPanelEquipmentBottom = ctx.canvas._mainPanelAdditionalEquipmentBottom;
        
        if (equipmentValveBranchesBottom) {
          branchBottom = Math.max(branchBottom, equipmentValveBranchesBottom);
        }
        if (mainPanelEquipmentBottom) {
          branchBottom = Math.max(branchBottom, mainPanelEquipmentBottom);
        }
      }
    }
    branchBottomPositions.push(branchBottom);

    // 記錄源頭閥件分支的位置（index > 0），用於確保後續分支不重疊
    if (index > 0) {
      drawnBranchPositions.push({
        branchY: branchY,
        bottomY: branchBottom
      });
    }

    // Add manifold panel for source valve branches (源頭閥件分支的額外盤面)
    if (index > 0 && branchModuleData && branchModuleData.manifoldPanelBranches && branchModuleData.manifoldPanelBranches.length > 0) {
      // 源頭閥件分支的額外盤面：從該分支的主要盤面（SWG box）左側向下繪製
      // 不應從閥件位置再畫一條線，而是從主盤面左側直接向下繪製盤面群組
      // 額外盤面位置應與主管線的額外盤面位置對齊（mainFloorLabelX + 270）
      const branchManifoldX = mainFloorLabelX + 270; // 與主管線的額外盤面位置對齊（vertLineX + 270）
      const branchManifoldBranchSpacing = 140;
      const branchNumManifoldBranches = branchModuleData.manifoldPanelBranches.length;

      // 從主盤面（SWG box）左側連接到額外盤面位置（水平線）
      // 源頭閥件分支的額外盤面連接點應與主管線額外盤面連接點相同
      // 主管線的額外盤面連接點是 vertLineX + 200，所以源頭閥件分支也使用相同的位置
      // 但源頭閥件分支的 vertLineX 是 mainFloorLabelX（在 1670 行設置），所以使用 mainFloorLabelX + 200
      const branchManifoldConnectionStartX = mainFloorLabelX + 200; // 與主管線額外盤面連接點相同，讓起始點更靠右
      drawLineByType(ctx, branchManifoldConnectionStartX, branchY, branchManifoldX, branchY, sourcePipelineType, false);

      // Draw branch manifold branches based on actual data
      // 計算額外盤面的起始位置：根據主盤面的實際底部自適應
      let currentBranchManifoldY = branchY;
      const branchManifoldBranchYPositions = [];

      // 獲取主盤面的實際底部位置
      const branchMainPanelBottomY = ctx.canvas._branchMainPanelAdditionalEquipmentBottom || (branchY + 50);

      // 計算每個額外盤面的Y位置（自適應高度）
      // 參考主管線邏輯：主盤面與第一個額外盤面的間距應與額外盤面之間的間距一致
      branchModuleData.manifoldPanelBranches.forEach((branchManifoldBranchData, idx) => {
        if (idx === 0) {
          // 第一個額外盤面：間距應與額外盤面之間的間距一致
          // 檢查主盤面是否有額外設備
          const mainPanelHasAdditionalEquipment = !!ctx.canvas._branchMainPanelAdditionalEquipmentBottom;

          if (mainPanelHasAdditionalEquipment) {
            // 主盤面有額外設備：使用與額外盤面之間相同的間距（80從最後一個設備底部）
            // branchMainPanelBottomY = lastEquipmentY + 100，所以 lastEquipmentY = branchMainPanelBottomY - 100
            // 間距應該是 lastEquipmentY + 80 = branchMainPanelBottomY - 20
            currentBranchManifoldY = branchMainPanelBottomY + 20;
          } else {
            // 主盤面沒有額外設備：使用固定間距 120（與額外盤面之間相同）
            currentBranchManifoldY = branchY + 120;
          }
        } else {
          // 後續額外盤面：從前一個額外盤面底部開始
          const prevPanelGroup = branchModuleData.panelEquipmentGroups?.[idx]; // idx 對應前一個額外盤面
          const prevAdditionalEquipmentCards = prevPanelGroup?.additionalEquipmentCards || [];

          if (prevAdditionalEquipmentCards.length > 0) {
            // 如果前一個額外盤面有額外設備，從最後一個額外設備底部開始
            const prevPanelY = branchManifoldBranchYPositions[idx - 1];
            const lastEquipmentY = prevPanelY + (prevAdditionalEquipmentCards.length) * 120;
            currentBranchManifoldY = lastEquipmentY + 80; // 設備底部 + 最小間距
          } else {
            // 沒有額外設備，使用固定間距
            currentBranchManifoldY += 120;
          }
        }

        branchManifoldBranchYPositions.push(currentBranchManifoldY);
      });

      branchManifoldBranchYPositions.forEach((yPos, branchManifoldIdx) => {
        const branchManifoldBranchData = branchModuleData.manifoldPanelBranches[branchManifoldIdx];
        if (!branchManifoldBranchData) return;

        // Find which line connects to this branch (類似於主管線的邏輯)
        const lineIdx = branchManifoldIdx === 0 ? 1 : 0; // Reverse mapping

        // 垂直线從主盤面的Y位置（branchY）開始，向下到額外盤面分支的位置
        const lineOffsetX = lineIdx * 20;
        const lineStartX = branchManifoldX + lineOffsetX;

        // 獲取盤面分支的管線類型（使用盤面的 backPipelineType）
        // 直接使用已保存的 panel 數據
        const branchManifoldPanelData = branchManifoldBranchData.panel || {};
        const branchManifoldPipelineType = branchManifoldPanelData.backPipelineType || sourcePipelineType;

        // Draw vertical line（使用盤面分支的管線類型）
        // 從主盤面的Y位置（branchY）向下到額外盤面分支的位置（yPos）
        drawLineByType(ctx, lineStartX, branchY, lineStartX, yPos, branchManifoldPipelineType, true);

        // Draw horizontal line（使用盤面分支的管線類型）
        const lineAfterBranch = lineStartX + 30;
        drawLineByType(ctx, lineStartX, yPos, lineAfterBranch, yPos, branchManifoldPipelineType, false);

        // 使用實際數據
        const branchManifoldChillerLines = branchManifoldBranchData.chillerLines || ['設備資訊'];

        // 計算設備卡片實際高度
        const lineHeight = 26;
        const actualBranchManifoldBoxHeight = calculateEquipmentBoxHeight(
          ctx,
          branchManifoldChillerLines,
          CHILLER_BOX_WIDTH,
          lineHeight,
          FONT_SECONDARY,
          BOX_HEIGHT
        );

        const branchManifoldBoxTop = yPos - actualBranchManifoldBoxHeight / 2;

        // Chiller box
        ctx.strokeRect(chillerBoxLeftX, branchManifoldBoxTop, CHILLER_BOX_WIDTH, actualBranchManifoldBoxHeight);

        // 計算文本起始位置
        const textStartY = branchManifoldBoxTop + lineHeight + 10;

        drawTextBlock(ctx, branchManifoldChillerLines, chillerBoxLeftX + 15, textStartY, {
          font: FONT_SECONDARY,
          lineHeight: lineHeight,
          maxWidth: CHILLER_BOX_WIDTH - 30
        });

        // 計算 SWG box 的位置（移到這裡以供後續使用）
        const branchManifoldLineBeforeChillerX = chillerBoxLeftX - 400;
        const branchManifoldFirstBoxRightX = branchManifoldLineBeforeChillerX;

        // 繪製源頭閥件分支額外盤面的額外設備分支
        // 參考主管線模式：從 SWG box 右側分支，而不是主設備右側
        // 這樣可以確保即使沒有主設備，連接線也是正確的

        // 確保使用正確的索引
        const branchManifoldPanelGroup = branchModuleData.panelEquipmentGroups?.[branchManifoldIdx + 1];
        const branchManifoldAdditionalEquipmentCards = branchManifoldPanelGroup?.additionalEquipmentCards || [];

        if (branchManifoldAdditionalEquipmentCards.length > 0) {
          // 分支點設在 SWG box 右側 30px
          const equipmentBaseX = branchManifoldFirstBoxRightX + 30;
          const equipmentBranchSpacing = 120;  // 額外設備分支間距

          // 計算額外設備的Y位置
          const numEquipmentBranches = branchManifoldAdditionalEquipmentCards.length;
          const equipmentYPositions = [];
          for (let i = 0; i < numEquipmentBranches; i++) {
            equipmentYPositions.push(yPos + (i + 1) * equipmentBranchSpacing);
          }

          equipmentYPositions.forEach((equipY, equipBranchIdx) => {
            const additionalCard = branchManifoldAdditionalEquipmentCards[equipBranchIdx];
            if (!additionalCard) return;

            // 找出連接到此設備的線條（反向映射）
            const equipLineIdx = equipBranchIdx === 0 ? 1 : 0;

            const equipStartY = yPos;
            const equipLineOffsetX = equipLineIdx * 20;
            const equipLineStartX = equipmentBaseX + equipLineOffsetX;

            // 獲取設備分支的管線類型
            // 注意：在數據提取時，valve 已經是 card?.valve?.data，所以不需要再訪問 .data
            const additionalValveData = additionalCard?.valve || {};
            const equipmentPipelineType = additionalValveData.backPipelineType || branchManifoldPipelineType;

            // 繪製垂直線（使用設備分支的管線類型）
            drawLineByType(ctx, equipLineStartX, equipStartY, equipLineStartX, equipY, equipmentPipelineType, true);

            // 繪製水平線（使用設備分支的管線類型）
            const equipLineEndX = equipLineStartX + 50;
            drawLineByType(ctx, equipLineStartX, equipY, equipLineEndX, equipY, equipmentPipelineType, false);

            // 構建額外設備資訊
            const additionalData = additionalCard?.data || {};
            const additionalLines = buildEquipmentLines(additionalData, {}, { sourceGasType: sourceGasType });

            // 計算額外設備卡片高度
            const lineHeight = 26;
            const actualAdditionalHeight = calculateEquipmentBoxHeight(
              ctx,
              additionalLines,
              CHILLER_BOX_WIDTH,
              lineHeight,
              FONT_SECONDARY,
              BOX_HEIGHT
            );

            // 如果有額外設備閥件，繪製閥件
            // 使用與主管線模式相同的檢查方式：檢查對象是否有任何鍵
            const hasAdditionalValve = !!(additionalValveData && Object.keys(additionalValveData).length > 0);
            if (hasAdditionalValve) {
              const additionalValveSize = 50;
              const additionalValveCenterX = chillerBoxLeftX - additionalValveSize / 2 - 70;

              // 連接線：從水平線到閥件
              drawLineByType(ctx, equipLineEndX, equipY, additionalValveCenterX - additionalValveSize / 2 - 10, equipY, equipmentPipelineType, false);

              // 繪製閥件
              const additionalValveInfo = {
                valveType: additionalValveData.valveType || '',
                valveSize: additionalValveData.size || '',
                valveConnector: additionalValveData.connectorType || ''
              };
              drawValveSymbol(ctx, additionalValveCenterX, equipY, additionalValveSize, '1/4"', null, false, additionalValveInfo);

              // 連接線：從閥件到設備（使用閥件的 backPipelineType）
              const additionalValveBackPipelineType = additionalValveData.backPipelineType || equipmentPipelineType;
              drawLineByType(ctx, additionalValveCenterX + additionalValveSize / 2 + 10, equipY, chillerBoxLeftX, equipY, additionalValveBackPipelineType, false);
            } else {
              // 沒有閥件時，直接從水平線連接到設備
              drawLineByType(ctx, equipLineEndX, equipY, chillerBoxLeftX, equipY, equipmentPipelineType, false);
            }

            // 繪製額外設備卡片
            const additionalTop = equipY - actualAdditionalHeight / 2;
            ctx.strokeRect(chillerBoxLeftX, additionalTop, CHILLER_BOX_WIDTH, actualAdditionalHeight);
            const additionalTextStartY = additionalTop + lineHeight + 10;
            drawTextBlock(ctx, additionalLines, chillerBoxLeftX + 15, additionalTextStartY, {
              font: FONT_SECONDARY,
              lineHeight: lineHeight,
              maxWidth: CHILLER_BOX_WIDTH - 30
            });
          });
        }

        // Line before chiller (已在上面定義)
        // const branchManifoldLineBeforeChillerX = chillerBoxLeftX - 400;

        // 獲取盤面分支的閥件管線類型
        const branchManifoldValve = branchManifoldBranchData.valve || {};
        const branchManifoldValveBackPipelineType = branchManifoldValve.backPipelineType || branchManifoldPipelineType;

        // 定義閥件相關變量
        const branchManifoldValveSize = 50;
        const branchManifoldValveCenterX = chillerBoxLeftX - branchManifoldValveSize / 2 - 70;

        // Draw valve before Chiller (只在設備有閥件時繪製)
        if (branchManifoldBranchData.hasValve) {
          // Line from SWG area to valve
          drawLineByType(ctx, branchManifoldLineBeforeChillerX, yPos, branchManifoldValveCenterX - branchManifoldValveSize / 2 - 10, yPos, branchManifoldPipelineType, false);

          // Draw valve symbol
          const branchManifoldValveInfo = {
            valveType: branchManifoldBranchData.valveType || '',
            valveSize: branchManifoldBranchData.valveSize || '',
            valveConnector: branchManifoldBranchData.valveConnector || ''
          };
          drawValveSymbol(ctx, branchManifoldValveCenterX, yPos, branchManifoldValveSize, '1/2"', null, false, branchManifoldValveInfo);

          // Line from valve to Chiller
          drawLineByType(ctx, branchManifoldValveCenterX + branchManifoldValveSize / 2 + 10, yPos, chillerBoxLeftX, yPos, branchManifoldValveBackPipelineType, false);
        } else {
          // 沒有閥件時，直接從 SWG 連接到設備
          drawLineByType(ctx, branchManifoldLineBeforeChillerX, yPos, chillerBoxLeftX, yPos, branchManifoldPipelineType, false);
        }

        // SWG box
        // const branchManifoldFirstBoxRightX = branchManifoldLineBeforeChillerX; (已在上面定義)
        const branchManifoldFirstBoxLeftX = branchManifoldFirstBoxRightX - BOX_WIDTH;
        const branchManifoldSwgBoxTop = yPos - BOX_HEIGHT / 2;
        ctx.strokeRect(branchManifoldFirstBoxLeftX, branchManifoldSwgBoxTop, BOX_WIDTH, BOX_HEIGHT);
        drawTextBlock(ctx, [branchManifoldBranchData.swgLabel || 'SWG'], branchManifoldFirstBoxLeftX + 15, branchManifoldSwgBoxTop + BOX_HEIGHT / 2 + 8, {
          font: FONT_SECONDARY,
          align: 'left'
        });

        // Line from branch to SWG
        drawLineByType(ctx, lineAfterBranch, yPos, branchManifoldFirstBoxLeftX, yPos, branchManifoldPipelineType, false);
      });

      // 更新分支底部位置，考慮額外盤面的高度
      const lastBranchManifoldY = branchManifoldBranchYPositions[branchManifoldBranchYPositions.length - 1];
      const updatedBranchBottom = Math.max(branchBottom, lastBranchManifoldY + 100); // 額外盤面底部 + 間距

      // 更新已記錄的分支底部位置
      if (index > 0 && drawnBranchPositions.length > 0) {
        const lastDrawnBranch = drawnBranchPositions[drawnBranchPositions.length - 1];
        if (lastDrawnBranch.branchY === branchY) {
          lastDrawnBranch.bottomY = updatedBranchBottom;
        }
      }

      // 更新 branchBottomPositions 數組中對應的元素
      if (branchBottomPositions.length > index) {
        branchBottomPositions[index] = updatedBranchBottom;
      }
    }

    // Add manifold panel for main branch only (只在有盤面分支數據時繪製)
    if (index === 0 && moduleData.manifoldPanelBranches && moduleData.manifoldPanelBranches.length > 0) {
      // 額外盤面的連接線起點更靠右，避免與樓層資訊重疊，並避免多餘的線
      const manifoldX = vertLineX + 270;  // 額外盤面位置，讓連接線終點更靠右
      const manifoldTopY = branchY;
      const manifoldBranchSpacing = 120;  // 額外盤面間距（與設備分支間距一致）
      const numManifoldBranches = moduleData.manifoldPanelBranches.length;
      const manifoldBottomY = branchY + numManifoldBranches * manifoldBranchSpacing;

      // 額外盤面的連接線：從 vertLineX 之後更靠右的位置連接到 manifoldX
      // 主管線已經有從 beforeVertLineX 到 vertLineX 的連接線（在 1652 行繪製，用於樓層資訊）
      // 額外盤面從 vertLineX 之後的某個位置（比如 vertLineX + 50）連接到 manifoldX
      // 這樣可以避免從 vertLineX 延伸出來的多餘線條，因為連接線起點在 vertLineX 之後
      const manifoldConnectionStartX = vertLineX + 200; // 從樓層資訊位置之後 200px 開始，讓起始點更靠右
      // 水平線連接到 manifoldX，每個分支會從 manifoldX + lineOffsetX 位置繪製自己的垂直线
      // 不需要主垂直 manifold line，因為每個分支都有自己的垂直线，主垂直線是多餘的
      drawLineByType(ctx, manifoldConnectionStartX, branchY, manifoldX, branchY, sourcePipelineType, false);

      // Draw manifold branches based on actual data
      // 計算額外盤面的起始位置：根據主盤面的實際底部自適應
      let currentManifoldY = branchY;
      const manifoldBranchYPositions = [];

      // 獲取主盤面的實際底部位置
      // 考慮設備閥件分支、額外設備分支的底部位置
      const equipmentValveBranchesBottom = ctx.canvas._equipmentValveBranchesBottom;
      const mainPanelEquipmentBottom = ctx.canvas._mainPanelAdditionalEquipmentBottom;

      let firstManifoldY;
      // 取所有可能的底部位置的最大值
      const bottoms = [];
      if (equipmentValveBranchesBottom) bottoms.push(equipmentValveBranchesBottom);
      if (mainPanelEquipmentBottom) bottoms.push(mainPanelEquipmentBottom);
      
      if (bottoms.length > 0) {
        // 從最大底部位置 + 間距開始
        firstManifoldY = Math.max(...bottoms) + 20;
      } else {
        // 如果沒有額外設備或設備閥件分支，使用固定間距
        firstManifoldY = branchY + manifoldBranchSpacing;
      }

      // Connection mapping: line order -> branch order (removed first branch)
      // Line 0 (first, leftmost) -> Branch 2 (second, bottom with equipment)
      // Line 1 (second) -> Branch 1 (first, top)
      // Branch 0 removed
      const connectionMap = [1, 0];  // Line index -> Branch index (map to branchIdx 1 and 2, but use 0 and 1 in array)

      moduleData.manifoldPanelBranches.forEach((manifoldBranchData, branchIdx) => {
        if (!manifoldBranchData) return;

        if (branchIdx === 0) {
          currentManifoldY = firstManifoldY;
        } else {
          // Check previous panel for additional equipment
          // branchIdx is index in manifoldPanelBranches
          // manifoldPanelBranches[0] is panelEquipmentGroups[1]
          // So previous panel is panelEquipmentGroups[branchIdx]
          const prevPanelGroup = moduleSet.panelEquipmentGroups?.[branchIdx];
          const prevAdditionalEquipmentCards = prevPanelGroup?.additionalEquipmentCards || [];

          if (prevAdditionalEquipmentCards.length > 0) {
            const prevPanelY = manifoldBranchYPositions[branchIdx - 1];
            const lastEquipmentY = prevPanelY + (prevAdditionalEquipmentCards.length) * 120;
            currentManifoldY = lastEquipmentY + 80; // 設備底部 + 最小間距
          } else {
            currentManifoldY += manifoldBranchSpacing;
          }
        }
        manifoldBranchYPositions.push(currentManifoldY);
        const yPos = currentManifoldY;

        // Find which line connects to this branch
        // branchIdx 0 -> Branch 1 (was Branch 0) -> Line 1
        // branchIdx 1 -> Branch 2 (was Branch 1) -> Line 0
        const lineIdx = branchIdx === 0 ? 1 : 0;  // Reverse mapping

        // All lines start from same Y, different X
        const startY = branchY;
        const lineOffsetX = lineIdx * 20;
        const lineStartX = manifoldX + lineOffsetX;

        // 獲取盤面分支的管線類型（使用盤面的 backPipelineType）
        // manifoldPanelBranches 是從 panelEquipmentGroups.slice(1) 提取的
        // 所以 branchIdx 直接對應 panelEquipmentGroups[branchIdx + 1]
        // 第一個額外盤面（branchIdx=0）對應 panelEquipmentGroups[1]
        // 第二個額外盤面（branchIdx=1）對應 panelEquipmentGroups[2]
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

        // 繪製額外盤面的額外設備（起始點在父管線的盤面右側）
        // 額外盤面的額外設備從額外盤面分支的設備卡片右側開始繪製
        // branchIdx 直接對應 panelEquipmentGroups[branchIdx + 1]
        let currentManifoldEquipmentX = chillerBoxLeftX; // 額外盤面設備卡片的X位置
        const manifoldPanelGroup = moduleSet.panelEquipmentGroups?.[branchIdx + 1];
        const manifoldAdditionalEquipmentCards = manifoldPanelGroup?.additionalEquipmentCards || [];

        if (manifoldAdditionalEquipmentCards.length > 0) {
          const additionalEquipmentSpacing = 120; // 額外設備之間的間距（減小以更緊湊）
          let currentManifoldAdditionalX = currentManifoldEquipmentX + CHILLER_BOX_WIDTH + additionalEquipmentSpacing;

          manifoldAdditionalEquipmentCards.forEach((additionalCard, cardIndex) => {
            const additionalData = additionalCard?.data || {};
            const additionalValveData = additionalCard?.valve?.data || {};
            // 使用與主管線模式相同的檢查方式：檢查對象是否有任何鍵
            const hasAdditionalValve = !!(additionalValveData && Object.keys(additionalValveData).length > 0);

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
            const additionalTop = yPos - actualAdditionalHeight / 2;

            // 設備卡片右側不應有閥件的資訊，直接從前一個設備連接到額外設備
            const prevEquipmentRightX = cardIndex === 0
              ? currentManifoldEquipmentX + CHILLER_BOX_WIDTH
              : currentManifoldAdditionalX - additionalEquipmentSpacing + CHILLER_BOX_WIDTH;
            drawLineByType(ctx, prevEquipmentRightX, yPos, currentManifoldAdditionalX, yPos, manifoldPipelineType, false);

            // 繪製額外設備卡片
            ctx.strokeRect(currentManifoldAdditionalX, additionalTop, CHILLER_BOX_WIDTH, actualAdditionalHeight);
            const additionalTextStartY = additionalTop + lineHeight + 10;
            drawTextBlock(ctx, additionalLines, currentManifoldAdditionalX + 15, additionalTextStartY, {
              font: FONT_SECONDARY,
              lineHeight: lineHeight,
              maxWidth: CHILLER_BOX_WIDTH - 30
            });

            // 更新下一個額外設備的 X 位置
            currentManifoldAdditionalX += CHILLER_BOX_WIDTH + additionalEquipmentSpacing;
          });
        }

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

          // 連接線：從閥件到 Chiller（使用閥件的 backPipelineType）
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

        // Add additional equipment branches for this manifold branch
        if (manifoldBranchData.additionalEquipmentBranches && manifoldBranchData.additionalEquipmentBranches.length > 0) {
          const equipmentBaseX = manifoldFirstBoxRightX + 30;
          const equipmentBranchSpacing = 120;  // 設備分支間距（與主盤面一致）

          // Draw equipment branches based on actual data
          // 直接從盤面位置開始計算，與主盤面一致
          const numEquipmentBranches = manifoldBranchData.additionalEquipmentBranches.length;
          const equipmentYPositions = [];
          for (let i = 0; i < numEquipmentBranches; i++) {
            equipmentYPositions.push(yPos + (i + 1) * equipmentBranchSpacing);
          }

          equipmentYPositions.forEach((equipY, equipBranchIdx) => {
            const equipmentBranchData = manifoldBranchData.additionalEquipmentBranches[equipBranchIdx];
            if (!equipmentBranchData) return;
            // Find which line connects to this equipment
            // equipBranchIdx 0 -> Equipment 1 (was Equipment 0) -> Line 1
            // equipBranchIdx 1 -> Equipment 2 (was Equipment 1) -> Line 0
            const equipLineIdx = equipBranchIdx === 0 ? 1 : 0;  // Reverse mapping

            const equipStartY = yPos;
            const equipLineOffsetX = equipLineIdx * 20;
            const equipLineStartX = equipmentBaseX + equipLineOffsetX;

            // 獲取設備分支的管線類型（使用閥件的 backPipelineType）
            const manifoldPanelGroup = moduleSet.panelEquipmentGroups?.[branchIdx + 1];
            const equipmentCard = manifoldPanelGroup?.additionalEquipmentCards?.[equipBranchIdx];
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

          // Update currentManifoldY to include the height of additional equipment
          const equipmentExtension = 120 * numEquipmentBranches;  // 使用實際的設備分支間距
          currentManifoldY += equipmentExtension;
        }
      });

      ctx.canvas._manifoldBottomY = currentManifoldY;

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
    const sourceBottom = branchSourceBottomY > sourceY + actualSourceBlockHeight
      ? branchSourceBottomY
      : sourceY + actualSourceBlockHeight;
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


