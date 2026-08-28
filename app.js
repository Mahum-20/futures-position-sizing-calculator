/* ==========================================================================
   APP ENGINE - RISKMARGIN PRO (CRYPTO FUTURES TERMINAL)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // --- First-time Visitor Session Initialization ---
  if (!localStorage.getItem('riskmargin_v3_session')) {
    localStorage.setItem('riskmargin_v3_session', 'true');
    localStorage.removeItem('riskmargin_pro_trades');
    localStorage.removeItem('riskmargin_trades');
  }

  // --- App State ---
  let state = {
    mode: 'percentage', // 'percentage' or 'price'
    direction: 'long',
    riskUsd: 25,
    slPercent: 2.0,
    entryPrice: 65000,
    slPrice: 63700,
    leverage: 20,
    selectedRR: 2,
    assetSymbol: 'BTC/USDT',
    selectedPair: 'BTCUSDT',
    includeFees: false,
    currency: 'USD',
    soundEnabled: true,
    portfolioCap: 5000,
    portfolioRiskPct: 1.0,
    winRateEstimate: 55,
    marketShockPct: 0,
    livePrices: {
      'BTCUSDT': { price: 65000, change: 1.5 },
      'ETHUSDT': { price: 3500, change: -0.8 },
      'SOLUSDT': { price: 145, change: 3.2 },
      'BNBUSDT': { price: 580, change: 0.5 },
      'XRPUSDT': { price: 0.58, change: -1.2 },
      'DOGEUSDT': { price: 0.12, change: 4.1 },
      'SUIUSDT': { price: 1.65, change: 2.8 }
    },
    savedTrades: JSON.parse(localStorage.getItem('riskmargin_pro_trades') || '[]')
  };

  // --- Currency Conversion Rates ---
  const currencyRates = {
    USD: { rate: 1.0, symbol: '$', code: 'USD' },
    EUR: { rate: 0.92, symbol: '€', code: 'EUR' },
    GBP: { rate: 0.78, symbol: '£', code: 'GBP' },
    CAD: { rate: 1.35, symbol: 'CA$', code: 'CAD' },
    AUD: { rate: 1.52, symbol: 'A$', code: 'AUD' },
    INR: { rate: 83.50, symbol: '₹', code: 'INR' },
    JPY: { rate: 155.0, symbol: '¥', code: 'JPY' },
    PKR: { rate: 278.50, symbol: 'Rs ', code: 'PKR' }
  };

  function getCurr() {
    return currencyRates[state.currency] || currencyRates.USD;
  }

  function fmtVal(usdAmount, decimals = 2) {
    const c = getCurr();
    const converted = usdAmount * c.rate;
    return `${c.symbol}${converted.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}`;
  }

  function updateCurrencyLabels() {
    const c = getCurr();
    document.querySelectorAll('.currency-sym').forEach(el => {
      el.textContent = c.symbol;
    });
  }

  // --- Web Audio Synthesizer (Audio FX) ---
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playClickSound() {
    if (!state.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) { }
  }

  function playAlertSound() {
    if (!state.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.setValueAtTime(300, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) { }
  }

  function playSuccessSound() {
    if (!state.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.1, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.12);
      });
    } catch (e) { }
  }

  // --- DOM Elements ---
  const currencySelect = document.getElementById('currencySelect');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const copySummaryBtn = document.getElementById('copySummaryBtn');
  const exportCardBtn = document.getElementById('exportCardBtn');

  // Inputs
  const riskInput = document.getElementById('riskInput');
  const slPercentInput = document.getElementById('slPercentInput');
  const slPercentSlider = document.getElementById('slPercentSlider');
  const slPercentValDisplay = document.getElementById('slPercentValDisplay');
  const leverageInput = document.getElementById('leverageInput');
  const leverageSlider = document.getElementById('leverageSlider');
  const leverageValDisplay = document.getElementById('leverageValDisplay');

  const entryPriceInput = document.getElementById('entryPriceInput');
  const slPriceInput = document.getElementById('slPriceInput');
  const computedSlHint = document.getElementById('computedSlHint');
  const entryPriceOpt = document.getElementById('entryPriceOpt');

  const dirLongRadio = document.getElementById('dirLong');
  const dirShortRadio = document.getElementById('dirShort');

  const modeTabs = document.querySelectorAll('.mode-tab');
  const percentageModeFields = document.querySelectorAll('.percentage-mode-field');
  const priceModeFields = document.querySelectorAll('.price-mode-field');
  const advancedToggle = document.getElementById('advancedToggle');
  const advancedContent = document.getElementById('advancedContent');
  const assetSymbolInput = document.getElementById('assetSymbol');
  const includeFeesCheckbox = document.getElementById('includeFees');

  // Presets & Buttons
  const riskPresets = document.getElementById('riskPresets');
  const slPresets = document.getElementById('slPresets');
  const leveragePresets = document.getElementById('leveragePresets');
  const rrButtons = document.querySelectorAll('.rr-btn');

  // Outputs
  const marginOutput = document.getElementById('marginOutput');
  const marginHighlight = document.getElementById('marginHighlight');
  const levHighlight = document.getElementById('levHighlight');
  const riskHighlight = document.getElementById('riskHighlight');
  const slHighlight = document.getElementById('slHighlight');

  const positionSizeVal = document.getElementById('positionSizeVal');
  const coinQtyVal = document.getElementById('coinQtyVal');
  const marginLossPctVal = document.getElementById('marginLossPctVal');
  const maxDollarLossVal = document.getElementById('maxDollarLossVal');
  const liqDistanceVal = document.getElementById('liqDistanceVal');
  const liqPriceVal = document.getElementById('liqPriceVal');
  const feeEstVal = document.getElementById('feeEstVal');
  const safetyStatusPill = document.getElementById('safetyStatusPill');
  const liqAlertBox = document.getElementById('liqAlertBox');
  const liqAlertText = document.getElementById('liqAlertText');

  // Visual Gauge
  const gaugeMarginBar = document.getElementById('gaugeMarginBar');
  const gaugeBorrowedBar = document.getElementById('gaugeBorrowedBar');
  const gaugeMarginPct = document.getElementById('gaugeMarginPct');
  const gaugeBorrowedVal = document.getElementById('gaugeBorrowedVal');
  const gaugeMarginValLabel = document.getElementById('gaugeMarginValLabel');
  const gaugePositionValLabel = document.getElementById('gaugePositionValLabel');

  // Take Profit
  const tpRewardVal = document.getElementById('tpRewardVal');
  const tpDistanceVal = document.getElementById('tpDistanceVal');
  const tpRomVal = document.getElementById('tpRomVal');
  const tpPriceVal = document.getElementById('tpPriceVal');
  const dirBadge = document.getElementById('dirBadge');

  // Ticker elements
  const tickerChipsContainer = document.getElementById('tickerChips');
  const syncPriceBtn = document.getElementById('syncPriceBtn');

  // AI Audit Elements
  const aiGradeBadge = document.getElementById('aiGradeBadge');
  const aiScorePct = document.getElementById('aiScorePct');
  const aiGradeSummary = document.getElementById('aiGradeSummary');
  const aiAuditAdvice = document.getElementById('aiAuditAdvice');

  // Navigation Tabs
  const dashTabs = document.querySelectorAll('.dash-tab');
  const tabContents = document.querySelectorAll('.tab-content');

  // Multi-TP Ladder Elements
  const tp1AllocInput = document.getElementById('tp1AllocInput');
  const tp1RrInput = document.getElementById('tp1RrInput');
  const tp1PriceEl = document.getElementById('tp1Price');
  const tp1CoinQtyEl = document.getElementById('tp1CoinQty');
  const tp1ProfitEl = document.getElementById('tp1Profit');

  const tp2AllocInput = document.getElementById('tp2AllocInput');
  const tp2RrInput = document.getElementById('tp2RrInput');
  const tp2PriceEl = document.getElementById('tp2Price');
  const tp2CoinQtyEl = document.getElementById('tp2CoinQty');
  const tp2ProfitEl = document.getElementById('tp2Profit');

  const tp3AllocInput = document.getElementById('tp3AllocInput');
  const tp3RrInput = document.getElementById('tp3RrInput');
  const tp3PriceEl = document.getElementById('tp3Price');
  const tp3CoinQtyEl = document.getElementById('tp3CoinQty');
  const tp3ProfitEl = document.getElementById('tp3Profit');

  const blendedTotalProfitEl = document.getElementById('blendedTotalProfit');
  const blendedRrEl = document.getElementById('blendedRr');
  const blendedRomEl = document.getElementById('blendedRom');
  const breakevenHintEl = document.getElementById('breakevenHint');

  // Portfolio Risk Elements
  const portfolioCapInput = document.getElementById('portfolioCapInput');
  const portfolioRiskPctInput = document.getElementById('portfolioRiskPctInput');
  const portRiskPresets = document.getElementById('portRiskPresets');
  const estimatedWinRateInput = document.getElementById('estimatedWinRate');
  const portCalcRiskVal = document.getElementById('portCalcRiskVal');
  const kellyOptimalVal = document.getElementById('kellyOptimalVal');
  const ruinTableBody = document.getElementById('ruinTableBody');

  // Stress Test Elements
  const shockSlider = document.getElementById('shockSlider');
  const shockValDisplay = document.getElementById('shockValDisplay');
  const shockSimPriceEl = document.getElementById('shockSimPrice');
  const shockPnlValEl = document.getElementById('shockPnlVal');
  const shockRoeValEl = document.getElementById('shockRoeVal');
  const shockRiskStatusEl = document.getElementById('shockRiskStatus');
  const fundCost8hEl = document.getElementById('fundCost8h');
  const fundCost24hEl = document.getElementById('fundCost24h');
  const fundCost7dEl = document.getElementById('fundCost7d');

  // Journal Elements
  const saveTradeBtn = document.getElementById('saveTradeBtn');
  const clearLogBtn = document.getElementById('clearLogBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const tradesTableBody = document.getElementById('tradesTableBody');
  const jstatTotal = document.getElementById('jstatTotal');
  const jstatWinRate = document.getElementById('jstatWinRate');
  const jstatTotalPnl = document.getElementById('jstatTotalPnl');
  const jstatProfitFactor = document.getElementById('jstatProfitFactor');

  // Social Card Export Modal
  const exportModal = document.getElementById('exportModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const downloadCardPngBtn = document.getElementById('downloadCardPngBtn');
  const copyCardClipboardBtn = document.getElementById('copyCardClipboardBtn');
  const socialCardCanvas = document.getElementById('socialCardCanvas');

  // Toast
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');

  // --- Binance Live Price Poller ---
  function fetchLivePrices() {
    fetch('https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT","XRPUSDT","DOGEUSDT","SUIUSDT"]')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          data.forEach(item => {
            const pair = item.symbol;
            const price = parseFloat(item.lastPrice);
            const change = parseFloat(item.priceChangePercent);
            state.livePrices[pair] = { price, change };

            // Update UI chip
            const priceEl = document.getElementById(`ticker-${pair}`);
            const changeEl = document.getElementById(`change-${pair}`);
            if (priceEl && changeEl) {
              priceEl.textContent = price > 10 ? price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : price.toFixed(4);
              changeEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
              changeEl.className = `change ${change >= 0 ? 'up' : 'down'}`;
            }
          });
        }
      })
      .catch(err => {
        // Soft fallback
      });
  }
  fetchLivePrices();
  setInterval(fetchLivePrices, 6000);

  // --- Primary Trade Calculation Engine ---
  function calculateTrade() {
    // 1. Inputs
    if (state.mode === 'price') {
      const entry = parseFloat(entryPriceInput.value) || 65000;
      const slP = parseFloat(slPriceInput.value) || 63700;
      state.entryPrice = entry;
      state.slPrice = slP;

      if (entry > 0) {
        if (state.direction === 'long') {
          state.slPercent = Math.max(0.001, ((entry - slP) / entry) * 100);
        } else {
          state.slPercent = Math.max(0.001, ((slP - entry) / entry) * 100);
        }
      }
      computedSlHint.textContent = `Distance: ${state.slPercent.toFixed(2)}% away`;
    } else {
      state.slPercent = Math.max(0.001, parseFloat(slPercentInput.value) || 2);
    }

    state.riskUsd = Math.max(0.01, parseFloat(riskInput.value) || 25);
    state.leverage = Math.max(1, parseInt(leverageInput.value) || 20);
    state.direction = dirLongRadio.checked ? 'long' : 'short';
    state.assetSymbol = assetSymbolInput.value.trim() || 'BTC/USDT';
    state.includeFees = includeFeesCheckbox.checked;

    // 2. Primary Math
    const slDecimal = state.slPercent / 100;
    const positionSizeUsd = state.riskUsd / slDecimal;
    const estimatedFeeUsd = positionSizeUsd * 0.001; // 0.05% in + out

    let requiredMarginUsd = positionSizeUsd / state.leverage;
    if (state.includeFees) {
      requiredMarginUsd += estimatedFeeUsd;
    }

    const lossOnMarginPct = state.slPercent * state.leverage;
    const liqDistancePct = (100 / state.leverage);

    let activeEntryPrice = state.mode === 'price'
      ? state.entryPrice
      : (parseFloat(entryPriceOpt.value) || 65000);

    let calculatedSlPrice = 0;
    let calculatedLiqPrice = 0;
    let coinQuantity = 0;

    if (activeEntryPrice > 0) {
      coinQuantity = positionSizeUsd / activeEntryPrice;
      if (state.direction === 'long') {
        calculatedSlPrice = activeEntryPrice * (1 - slDecimal);
        calculatedLiqPrice = activeEntryPrice * (1 - (1 / state.leverage));
      } else {
        calculatedSlPrice = activeEntryPrice * (1 + slDecimal);
        calculatedLiqPrice = activeEntryPrice * (1 + (1 / state.leverage));
      }
    }

    // Take Profit Math
    const tpDistancePct = state.slPercent * state.selectedRR;
    const targetRewardUsd = state.riskUsd * state.selectedRR;
    const returnOnMarginPct = (targetRewardUsd / requiredMarginUsd) * 100;

    let calculatedTpPrice = 0;
    if (activeEntryPrice > 0) {
      if (state.direction === 'long') {
        calculatedTpPrice = activeEntryPrice * (1 + (tpDistancePct / 100));
      } else {
        calculatedTpPrice = activeEntryPrice * (1 - (tpDistancePct / 100));
      }
    }

    const isLiqDangerous = state.slPercent >= liqDistancePct;

    // --- Update Primary UI Outputs ---
    marginOutput.textContent = (requiredMarginUsd * getCurr().rate).toFixed(2);
    marginHighlight.textContent = fmtVal(requiredMarginUsd);
    levHighlight.textContent = state.leverage;
    riskHighlight.textContent = fmtVal(state.riskUsd);
    slHighlight.textContent = `${state.slPercent.toFixed(2)}`;

    // Gauge
    const marginRatio = (1 / state.leverage) * 100;
    const borrowedRatio = 100 - marginRatio;
    const borrowedUsd = positionSizeUsd - requiredMarginUsd;

    gaugeMarginBar.style.width = `${Math.min(100, Math.max(2, marginRatio))}%`;
    gaugeBorrowedBar.style.width = `${Math.max(0, borrowedRatio)}%`;
    gaugeMarginPct.textContent = `${marginRatio.toFixed(1)}%`;
    gaugeBorrowedVal.textContent = fmtVal(borrowedUsd);
    gaugeMarginValLabel.textContent = fmtVal(requiredMarginUsd);
    gaugePositionValLabel.textContent = fmtVal(positionSizeUsd);

    // Metrics Grid
    positionSizeVal.textContent = fmtVal(positionSizeUsd);
    const baseAsset = state.assetSymbol.split('/')[0] || 'COIN';
    coinQtyVal.textContent = `${coinQuantity.toFixed(4)} ${baseAsset}`;

    marginLossPctVal.textContent = `${lossOnMarginPct.toFixed(2)}%`;
    maxDollarLossVal.textContent = `${fmtVal(state.riskUsd)} Loss`;
    liqDistanceVal.textContent = `~${liqDistancePct.toFixed(2)}%`;
    liqPriceVal.textContent = `Est. Price: $${calculatedLiqPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    feeEstVal.textContent = fmtVal(estimatedFeeUsd);

    // Liquidation Alert Status
    if (isLiqDangerous) {
      safetyStatusPill.className = 'status-pill danger';
      safetyStatusPill.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Liquidation Risk';
      liqAlertBox.classList.remove('hidden');
      liqAlertText.innerHTML = `Your Stop Loss (<strong>${state.slPercent.toFixed(2)}%</strong>) is wider than your estimated Liquidation price (<strong>~${liqDistancePct.toFixed(2)}%</strong>)! You risk instant liquidation before stop loss triggers. Lower leverage or tighten SL!`;
      playAlertSound();
    } else {
      safetyStatusPill.className = 'status-pill safe';
      safetyStatusPill.innerHTML = '<i class="fa-solid fa-shield-halved"></i> Safe Distance';
      liqAlertBox.classList.add('hidden');
    }

    // Take Profit Card
    tpRewardVal.textContent = `+${fmtVal(targetRewardUsd)}`;
    tpDistanceVal.textContent = `+${tpDistancePct.toFixed(2)}%`;
    tpRomVal.textContent = `+${returnOnMarginPct.toFixed(2)}%`;
    tpPriceVal.textContent = `$${calculatedTpPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    dirBadge.textContent = state.direction.toUpperCase();
    dirBadge.className = `dir-badge ${state.direction}`;

    // Update AI Auditor
    runAiAudit({
      positionSizeUsd,
      requiredMarginUsd,
      lossOnMarginPct,
      liqDistancePct,
      estimatedFeeUsd,
      targetRewardUsd,
      isLiqDangerous
    });

    // Update Interactive Canvas Chart
    drawPriceCanvasChart({
      activeEntryPrice,
      calculatedTpPrice,
      calculatedSlPrice,
      calculatedLiqPrice,
      targetRewardUsd,
      riskUsd: state.riskUsd,
      requiredMarginUsd
    });

    // Update Tab 2 Multi-TP Ladder
    updateMultiTpLadder(positionSizeUsd, activeEntryPrice, coinQuantity);

    // Update Tab 3 Portfolio Risk
    updatePortfolioRisk();

    // Update Tab 4 Stress Test
    updateStressTest(positionSizeUsd, requiredMarginUsd, activeEntryPrice);
  }

  // --- AI Trade Auditor Engine ---
  function runAiAudit(res) {
    let score = 100;
    const tips = [];

    // 1. Liquidation Distance Audit
    if (res.isLiqDangerous) {
      score -= 80;
      tips.push({ type: 'bad', text: '🔴 CRITICAL: Stop loss is wider than Liquidation price!' });
    } else if (state.slPercent < res.liqDistancePct * 0.4) {
      tips.push({ type: 'good', text: '🛡️ Safe liquidation distance buffer (>60% margin)' });
    } else {
      score -= 15;
      tips.push({ type: 'warn', text: '⚠️ Tight liquidation margin! Keep trailing SL ready.' });
    }

    // 2. Risk / Reward Ratio Audit
    if (state.selectedRR >= 3.0) {
      tips.push({ type: 'good', text: `🎯 Excellent 1:${state.selectedRR} Risk/Reward ratio!` });
    } else if (state.selectedRR >= 2.0) {
      tips.push({ type: 'good', text: `✅ Solid 1:${state.selectedRR} Risk/Reward setup.` });
    } else {
      score -= 20;
      tips.push({ type: 'warn', text: '⚠️ Low 1:1 R:R ratio requires high >55% win rate.' });
    }

    // 3. Fee Burden Audit
    const feeRatio = (res.estimatedFeeUsd / state.riskUsd) * 100;
    if (feeRatio > 12) {
      score -= 15;
      tips.push({ type: 'warn', text: `💸 Fee Burden: Exchange fees take ${feeRatio.toFixed(1)}% of your max risk!` });
    } else {
      tips.push({ type: 'good', text: `⚡ Low fee burden (${feeRatio.toFixed(1)}% of risk)` });
    }

    // 4. Leverage Volatility Audit
    if (state.leverage > 50) {
      score -= 20;
      tips.push({ type: 'bad', text: '🔥 Ultra high leverage (50x+) increases slippage ruin risk.' });
    } else if (state.leverage <= 10) {
      tips.push({ type: 'good', text: '💎 Conservative leverage (<=10x) protects capital.' });
    }

    score = Math.max(10, Math.min(100, score));

    // Grade Assignment
    let grade = 'A+';
    let gradeClass = 'grade-a';
    let summary = 'Optimal risk management with high R:R and liquidation safety.';

    if (score >= 90) {
      grade = 'A+'; gradeClass = 'grade-a';
    } else if (score >= 80) {
      grade = 'A'; gradeClass = 'grade-a'; summary = 'Strong setup with minimal vulnerability.';
    } else if (score >= 65) {
      grade = 'B'; gradeClass = 'grade-b'; summary = 'Decent trade structure with moderate risk.';
    } else if (score >= 45) {
      grade = 'C'; gradeClass = 'grade-c'; summary = 'Sub-optimal parameters. Review fee burden or R:R.';
    } else if (score >= 25) {
      grade = 'D'; gradeClass = 'grade-d'; summary = 'High risk of liquidation or poor risk balance.';
    } else {
      grade = 'F'; gradeClass = 'grade-f'; summary = 'FATAL SETUP: Stop Loss exceeds Liquidation price!';
    }

    aiGradeBadge.textContent = grade;
    aiGradeBadge.className = `grade-circle ${gradeClass}`;
    aiScorePct.textContent = `${score}%`;
    aiGradeSummary.textContent = summary;

    aiAuditAdvice.innerHTML = tips.map(t => `
      <div class="audit-tip-item ${t.type}">${t.text}</div>
    `).join('');
  }

  // --- HTML5 Canvas Interactive Chart Visualizer ---
  function drawPriceCanvasChart(data) {
    const canvas = document.getElementById('priceChartCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const width = canvas.width;
    const height = canvas.height;

    // Reset background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Draw Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const entry = data.activeEntryPrice || 65000;
    const tp = data.calculatedTpPrice || (entry * 1.04);
    const sl = data.calculatedSlPrice || (entry * 0.98);
    const liq = data.calculatedLiqPrice || (entry * 0.95);

    // Calculate Y scale coordinates
    const prices = [tp, entry, sl, liq];
    const maxP = Math.max(...prices) * 1.01;
    const minP = Math.min(...prices) * 0.99;

    function getY(price) {
      return height - ((price - minP) / (maxP - minP)) * (height - 60) - 30;
    }

    const yTp = getY(tp);
    const yEntry = getY(entry);
    const ySl = getY(sl);
    const yLiq = getY(liq);

    // Draw Green Reward Fill Zone
    ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
    ctx.fillRect(60, Math.min(yEntry, yTp), width - 120, Math.abs(yTp - yEntry));

    // Draw Red Risk Fill Zone
    ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
    ctx.fillRect(60, Math.min(yEntry, ySl), width - 120, Math.abs(ySl - yEntry));

    // Helper line drawer
    function drawLevelLine(y, color, label, valStr, isDashed = false) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      if (isDashed) ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(60, y);
      ctx.lineTo(width - 60, y);
      ctx.stroke();

      // Label Badge
      ctx.fillStyle = color;
      ctx.font = 'bold 11px JetBrains Mono';
      ctx.fillText(`${label}: $${valStr}`, 70, y - 6);
      ctx.restore();
    }

    drawLevelLine(yTp, '#10b981', `TP (Target +${state.selectedRR * state.slPercent}%)`, tp.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    drawLevelLine(yEntry, '#06b6d4', 'ENTRY LEVEL', entry.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), true);
    drawLevelLine(ySl, '#ef4444', `STOP LOSS (-${state.slPercent.toFixed(2)}%)`, sl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    drawLevelLine(yLiq, '#f59e0b', 'EST. LIQUIDATION', liq.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), true);
  }

  // --- TAB 2: Multi-Target TP Ladder ---
  function updateMultiTpLadder(posSizeUsd, entryPrice, totalCoinQty) {
    const a1 = Math.max(0, parseFloat(tp1AllocInput.value) || 30) / 100;
    const rr1 = Math.max(0.1, parseFloat(tp1RrInput.value) || 1.5);

    const a2 = Math.max(0, parseFloat(tp2AllocInput.value) || 50) / 100;
    const rr2 = Math.max(0.1, parseFloat(tp2RrInput.value) || 3.0);

    const a3 = Math.max(0, parseFloat(tp3AllocInput.value) || 20) / 100;
    const rr3 = Math.max(0.1, parseFloat(tp3RrInput.value) || 5.0);

    const baseAsset = state.assetSymbol.split('/')[0] || 'COIN';

    // Target 1
    const profit1 = state.riskUsd * rr1 * a1;
    const qty1 = totalCoinQty * a1;
    const tp1Dist = state.slPercent * rr1;
    const price1 = state.direction === 'long' ? entryPrice * (1 + tp1Dist / 100) : entryPrice * (1 - tp1Dist / 100);

    tp1PriceEl.textContent = `$${price1.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    tp1CoinQtyEl.textContent = `${qty1.toFixed(4)} ${baseAsset}`;
    tp1ProfitEl.textContent = `+${fmtVal(profit1)}`;

    // Target 2
    const profit2 = state.riskUsd * rr2 * a2;
    const qty2 = totalCoinQty * a2;
    const tp2Dist = state.slPercent * rr2;
    const price2 = state.direction === 'long' ? entryPrice * (1 + tp2Dist / 100) : entryPrice * (1 - tp2Dist / 100);

    tp2PriceEl.textContent = `$${price2.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    tp2CoinQtyEl.textContent = `${qty2.toFixed(4)} ${baseAsset}`;
    tp2ProfitEl.textContent = `+${fmtVal(profit2)}`;

    // Target 3
    const profit3 = state.riskUsd * rr3 * a3;
    const qty3 = totalCoinQty * a3;
    const tp3Dist = state.slPercent * rr3;
    const price3 = state.direction === 'long' ? entryPrice * (1 + tp3Dist / 100) : entryPrice * (1 - tp3Dist / 100);

    tp3PriceEl.textContent = `$${price3.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    tp3CoinQtyEl.textContent = `${qty3.toFixed(4)} ${baseAsset}`;
    tp3ProfitEl.textContent = `+${fmtVal(profit3)}`;

    // Summary
    const totalBlendedProfit = profit1 + profit2 + profit3;
    const blendedRrMultiplier = (rr1 * a1) + (rr2 * a2) + (rr3 * a3);
    const reqMargin = posSizeUsd / state.leverage;
    const blendedRom = (totalBlendedProfit / reqMargin) * 100;

    blendedTotalProfitEl.textContent = `+${fmtVal(totalBlendedProfit)}`;
    blendedRrEl.textContent = `1 : ${blendedRrMultiplier.toFixed(2)}`;
    blendedRomEl.textContent = `+${blendedRom.toFixed(2)}%`;
    breakevenHintEl.textContent = `Move SL to $${entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} after TP1 fills`;
  }

  // --- TAB 3: Portfolio & Kelly Simulator ---
  function updatePortfolioRisk() {
    state.portfolioCap = Math.max(10, parseFloat(portfolioCapInput.value) || 5000);
    state.portfolioRiskPct = Math.max(0.1, parseFloat(portfolioRiskPctInput.value) || 1.0);
    state.winRateEstimate = Math.max(1, Math.min(99, parseFloat(estimatedWinRateInput.value) || 55));

    const recommendedRiskUsd = state.portfolioCap * (state.portfolioRiskPct / 100);
    portCalcRiskVal.textContent = fmtVal(recommendedRiskUsd);

    // Kelly Criterion Formula: K% = W - [(1 - W) / R]
    const W = state.winRateEstimate / 100;
    const R = state.selectedRR;
    const kellyFraction = W - ((1 - W) / R);
    const kellyOptimalPct = Math.max(0, kellyFraction * 100 * 0.5); // Half Kelly for safe trading
    kellyOptimalVal.textContent = `${kellyOptimalPct.toFixed(1)}% of Capital`;

    // Drawdown Survival Table (Losses 1 through 8)
    let rowsHtml = '';
    let currentCap = state.portfolioCap;
    for (let lossCount = 1; lossCount <= 8; lossCount++) {
      const lossAmt = currentCap * (state.portfolioRiskPct / 100);
      currentCap -= lossAmt;
      const totalLossPct = ((state.portfolioCap - currentCap) / state.portfolioCap) * 100;
      const recoveryGainNeededPct = ((state.portfolioCap - currentCap) / currentCap) * 100;

      let statusBadge = '<span class="status-pill safe">Safe</span>';
      if (totalLossPct > 20) statusBadge = '<span class="status-pill danger">Critical Loss</span>';
      else if (totalLossPct > 10) statusBadge = '<span class="status-pill warn">Warning</span>';

      rowsHtml += `
        <tr>
          <td><strong>${lossCount} Consecutive Loss${lossCount > 1 ? 'es' : ''}</strong></td>
          <td class="loss">-${fmtVal(state.portfolioCap - currentCap)} (-${totalLossPct.toFixed(1)}%)</td>
          <td><strong>${fmtVal(currentCap)}</strong></td>
          <td>+${recoveryGainNeededPct.toFixed(1)}%</td>
          <td>${statusBadge}</td>
        </tr>`;
    }
    ruinTableBody.innerHTML = rowsHtml;
  }

  // --- TAB 4: Stress Test & Flash Wick Detector ---
  function updateStressTest(posSizeUsd, reqMarginUsd, entryPrice) {
    state.marketShockPct = parseFloat(shockSlider.value) || 0;
    shockValDisplay.textContent = `${state.marketShockPct >= 0 ? '+' : ''}${state.marketShockPct.toFixed(1)}%`;

    const shockDecimal = state.marketShockPct / 100;
    const simPrice = state.direction === 'long'
      ? entryPrice * (1 + shockDecimal)
      : entryPrice * (1 - shockDecimal);

    shockSimPriceEl.textContent = `$${simPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    let floatingPnlUsd = 0;
    if (state.direction === 'long') {
      floatingPnlUsd = posSizeUsd * shockDecimal;
    } else {
      floatingPnlUsd = posSizeUsd * (-shockDecimal);
    }

    const roePct = (floatingPnlUsd / reqMarginUsd) * 100;

    shockPnlValEl.textContent = `${floatingPnlUsd >= 0 ? '+' : ''}${fmtVal(floatingPnlUsd)}`;
    shockPnlValEl.className = `val ${floatingPnlUsd >= 0 ? 'gain' : 'loss'}`;

    shockRoeValEl.textContent = `${roePct >= 0 ? '+' : ''}${roePct.toFixed(2)}%`;
    shockRoeValEl.className = `val ${roePct >= 0 ? 'gain' : 'loss'}`;

    // Volatility risk status
    if (roePct <= -100) {
      shockRiskStatusEl.className = 'val status-pill danger';
      shockRiskStatusEl.textContent = 'LIQUIDATED!';
    } else if (roePct <= -50) {
      shockRiskStatusEl.className = 'val status-pill danger';
      shockRiskStatusEl.textContent = 'HIGH MARGIN CALL';
    } else {
      shockRiskStatusEl.className = 'val status-pill safe';
      shockRiskStatusEl.textContent = 'SAFE SL BUFFER';
    }

    // Funding fee estimates (0.01% est.)
    const cost8h = posSizeUsd * 0.0001;
    fundCost8hEl.textContent = fmtVal(cost8h);
    fundCost24hEl.textContent = fmtVal(cost8h * 3);
    fundCost7dEl.textContent = fmtVal(cost8h * 21);
  }

  // --- Social Graphic Card Export Generator ---
  function generateSocialCardCanvas() {
    const ctx = socialCardCanvas.getContext('2d');
    const w = socialCardCanvas.width;
    const h = socialCardCanvas.height;

    // Background Gradient
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#0b0f19');
    bg.addColorStop(0.5, '#111827');
    bg.addColorStop(1, '#0f172a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Subtle Glass Card Container
    ctx.fillStyle = 'rgba(30, 41, 59, 0.6)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(40, 40, w - 80, h - 80, 24);
    ctx.fill();
    ctx.stroke();

    // Brand Header
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 36px Inter';
    ctx.fillText('⚡ RISKMARGIN PRO', 70, 100);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 18px Inter';
    ctx.fillText('Institutional Position & Trade Setup Card', 70, 130);

    // Asset & Direction Badge
    const isLong = state.direction === 'long';
    ctx.fillStyle = isLong ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
    ctx.strokeStyle = isLong ? '#10b981' : '#ef4444';
    ctx.beginPath();
    ctx.roundRect(w - 280, 70, 210, 50, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isLong ? '#10b981' : '#ef4444';
    ctx.font = 'bold 22px JetBrains Mono';
    ctx.fillText(`${state.assetSymbol} ${state.direction.toUpperCase()}`, w - 260, 102);

    // Main Margin Hero Card Inside Graphic
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.beginPath();
    ctx.roundRect(70, 170, w - 140, 140, 18);
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 18px Inter';
    ctx.fillText('REQUIRED MARGIN CAPITAL', 100, 210);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 56px JetBrains Mono';
    ctx.fillText(fmtVal(state.riskUsd / (state.slPercent / 100) / state.leverage), 100, 275);

    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 24px JetBrains Mono';
    ctx.fillText(`${state.leverage}x LEVERAGE`, w - 300, 275);

    // Key Parameters Grid
    const posSizeUsd = state.riskUsd / (state.slPercent / 100);
    const entry = state.mode === 'price' ? state.entryPrice : (parseFloat(entryPriceOpt.value) || 65000);
    const tpDist = state.slPercent * state.selectedRR;
    const tpPrice = isLong ? entry * (1 + tpDist / 100) : entry * (1 - tpDist / 100);
    const slPrice = isLong ? entry * (1 - state.slPercent / 100) : entry * (1 + state.slPercent / 100);

    const drawGridBox = (x, y, label, val, color = '#f8fafc') => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.beginPath();
      ctx.roundRect(x, y, 240, 90, 12);
      ctx.fill();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px Inter';
      ctx.fillText(label, x + 20, y + 32);

      ctx.fillStyle = color;
      ctx.font = 'bold 20px JetBrains Mono';
      ctx.fillText(val, x + 20, y + 66);
    };

    drawGridBox(70, 330, 'Fixed Dollar Risk', fmtVal(state.riskUsd), '#ef4444');
    drawGridBox(330, 330, 'Position Size', fmtVal(posSizeUsd), '#06b6d4');
    drawGridBox(590, 330, 'Stop Loss %', `${state.slPercent.toFixed(2)}%`, '#ef4444');
    drawGridBox(850, 330, 'Target R:R Ratio', `1 : ${state.selectedRR}`, '#10b981');

    drawGridBox(70, 440, 'Entry Price', `$${entry.toLocaleString()}`, '#06b6d4');
    drawGridBox(330, 440, 'Stop Loss Price', `$${slPrice.toLocaleString()}`, '#ef4444');
    drawGridBox(590, 440, 'Take Profit Price', `$${tpPrice.toLocaleString()}`, '#10b981');
    drawGridBox(850, 440, 'Target Profit ($)', `+${fmtVal(state.riskUsd * state.selectedRR)}`, '#10b981');

    // Watermark Footer
    ctx.fillStyle = '#64748b';
    ctx.font = '500 14px Inter';
    ctx.fillText('Generated by RiskMargin PRO Terminal — 100% Free Position & Risk Engine', 70, 565);
  }

  // --- Event Listeners & Binding ---

  // Live Input Sync
  const allInputs = [
    riskInput, slPercentInput, leverageInput, entryPriceInput,
    slPriceInput, entryPriceOpt, assetSymbolInput, portfolioCapInput,
    portfolioRiskPctInput, estimatedWinRateInput, tp1AllocInput, tp1RrInput,
    tp2AllocInput, tp2RrInput, tp3AllocInput, tp3RrInput
  ];

  allInputs.forEach(inp => {
    if (inp) {
      inp.addEventListener('input', () => {
        playClickSound();
        syncSlidersAndInputs();
        calculateTrade();
      });
    }
  });

  // Range Sliders
  slPercentSlider.addEventListener('input', () => {
    playClickSound();
    slPercentInput.value = slPercentSlider.value;
    slPercentValDisplay.textContent = `${parseFloat(slPercentSlider.value).toFixed(1)}%`;
    updateActiveChip(slPresets, slPercentSlider.value);
    calculateTrade();
  });

  leverageSlider.addEventListener('input', () => {
    playClickSound();
    leverageInput.value = leverageSlider.value;
    leverageValDisplay.textContent = `${leverageSlider.value}x`;
    updateActiveChip(leveragePresets, leverageSlider.value);
    calculateTrade();
  });

  shockSlider.addEventListener('input', () => {
    playClickSound();
    calculateTrade();
  });

  // Presets
  setupPresetGroup(riskPresets, val => { riskInput.value = val; calculateTrade(); });
  setupPresetGroup(slPresets, val => { slPercentInput.value = val; slPercentSlider.value = val; calculateTrade(); });
  setupPresetGroup(leveragePresets, val => { leverageInput.value = val; leverageSlider.value = val; calculateTrade(); });
  setupPresetGroup(portRiskPresets, val => { portfolioRiskPctInput.value = val; calculateTrade(); });

  function setupPresetGroup(container, cb) {
    if (!container) return;
    container.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        playClickSound();
        container.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        cb(chip.dataset.value);
      });
    });
  }

  function updateActiveChip(container, val) {
    if (!container) return;
    container.querySelectorAll('.chip').forEach(chip => {
      if (parseFloat(chip.dataset.value) === parseFloat(val)) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });
  }

  function syncSlidersAndInputs() {
    const slVal = parseFloat(slPercentInput.value) || 2;
    slPercentSlider.value = Math.min(15, Math.max(0.1, slVal));
    slPercentValDisplay.textContent = `${slVal.toFixed(1)}%`;
    updateActiveChip(slPresets, slVal);

    const levVal = parseInt(leverageInput.value) || 20;
    leverageSlider.value = Math.min(100, Math.max(1, levVal));
    leverageValDisplay.textContent = `${levVal}x`;
    updateActiveChip(leveragePresets, levVal);
  }

  dirLongRadio.addEventListener('change', () => { playClickSound(); calculateTrade(); });
  dirShortRadio.addEventListener('change', () => { playClickSound(); calculateTrade(); });
  includeFeesCheckbox.addEventListener('change', () => { playClickSound(); calculateTrade(); });

  // Mode Switcher
  modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      playClickSound();
      modeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.mode = tab.dataset.mode;
      if (state.mode === 'percentage') {
        percentageModeFields.forEach(f => f.classList.remove('hidden'));
        priceModeFields.forEach(f => f.classList.add('hidden'));
      } else {
        percentageModeFields.forEach(f => f.classList.add('hidden'));
        priceModeFields.forEach(f => f.classList.remove('hidden'));
      }
      calculateTrade();
    });
  });

  // Risk/Reward Selector Buttons
  rrButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      playClickSound();
      rrButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.selectedRR = parseFloat(btn.dataset.rr);
      calculateTrade();
    });
  });

  // Ticker Chip Clicking & Price Syncing
  tickerChipsContainer.querySelectorAll('.ticker-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      playClickSound();
      tickerChipsContainer.querySelectorAll('.ticker-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.selectedPair = chip.dataset.pair;
      assetSymbolInput.value = `${chip.querySelector('.symbol').textContent}/USDT`;
    });
  });

  syncPriceBtn.addEventListener('click', () => {
    playSuccessSound();
    const liveObj = state.livePrices[state.selectedPair];
    if (liveObj && liveObj.price > 0) {
      entryPriceInput.value = liveObj.price;
      entryPriceOpt.value = liveObj.price;
      showToast(`Synced ${state.selectedPair} entry price: $${liveObj.price}`);
      calculateTrade();
    } else {
      showToast('Live price updating... try again in a moment');
    }
  });

  // Currency Switcher
  currencySelect.addEventListener('change', () => {
    playClickSound();
    state.currency = currencySelect.value;
    updateCurrencyLabels();
    calculateTrade();
    renderTradesJournalTable();
  });

  // Sound FX Toggle
  soundToggleBtn.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    const icon = soundToggleBtn.querySelector('i');
    if (state.soundEnabled) {
      icon.className = 'fa-solid fa-volume-high';
      showToast('Cyberpunk Sound FX Enabled');
      playClickSound();
    } else {
      icon.className = 'fa-solid fa-volume-xmark';
      showToast('Sound Muted');
    }
  });

  // Theme Toggle
  themeToggleBtn.addEventListener('click', () => {
    playClickSound();
    document.body.classList.toggle('light-theme');
    const icon = themeToggleBtn.querySelector('i');
    icon.className = document.body.classList.contains('light-theme') ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  });

  // Advanced Toggle Accordion
  advancedToggle.addEventListener('click', () => {
    playClickSound();
    advancedContent.classList.toggle('hidden');
    const icon = advancedToggle.querySelector('.toggle-icon');
    icon.style.transform = advancedContent.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
  });

  // Reset All Terminal Parameters & Saved Logs
  const resetAllBtn = document.getElementById('resetAllBtn');
  if (resetAllBtn) {
    resetAllBtn.addEventListener('click', () => {
      if (confirm('Reset terminal parameters and clear all saved trade logs?')) {
        playClickSound();
        localStorage.removeItem('riskmargin_pro_trades');
        localStorage.removeItem('riskmargin_trades');
        state.savedTrades = [];
        state.riskUsd = 25;
        state.slPercent = 2.0;
        state.leverage = 20;
        state.selectedRR = 2;
        state.direction = 'long';

        riskInput.value = 25;
        slPercentInput.value = 2;
        slPercentSlider.value = 2;
        leverageInput.value = 20;
        leverageSlider.value = 20;
        dirLongRadio.checked = true;

        renderTradesJournalTable();
        calculateTrade();
        showToast('Terminal data & saved logs reset!');
      }
    });
  }

  // Navigation Dashboard Tabs
  dashTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      playClickSound();
      dashTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const targetId = tab.dataset.tab;
      tabContents.forEach(content => {
        content.classList.toggle('active', content.id === targetId);
      });
    });
  });

  // Copy Setup Text
  copySummaryBtn.addEventListener('click', () => {
    playSuccessSound();
    const slVal = state.slPercent.toFixed(2);
    const entryP = state.mode === 'price' ? state.entryPrice : (parseFloat(entryPriceOpt.value) || 65000);
    const textToCopy =
      `📊 *RISKMARGIN PRO TRADE SETUP* 📊
• Pair: ${state.assetSymbol} (${state.direction.toUpperCase()})
• Entry Price: $${entryP.toLocaleString()}
• Fixed Risk: ${fmtVal(state.riskUsd)}
• Stop Loss: ${slVal}% away
• Leverage: ${state.leverage}x
-----------------------------
💰 REQUIRED MARGIN: ${fmtVal(state.riskUsd / (state.slPercent / 100) / state.leverage)}
📈 Position Size: ${fmtVal(state.riskUsd / (state.slPercent / 100))}
🎯 Target TP (1:${state.selectedRR}): ${tpPriceVal.textContent} (+${fmtVal(state.riskUsd * state.selectedRR)})`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast('Trade setup copied to clipboard!');
    }).catch(() => showToast('Failed to copy text.'));
  });

  // Export Graphic Card Modal Handlers
  exportCardBtn.addEventListener('click', () => {
    playClickSound();
    generateSocialCardCanvas();
    exportModal.classList.remove('hidden');
  });

  closeModalBtn.addEventListener('click', () => {
    playClickSound();
    exportModal.classList.add('hidden');
  });

  downloadCardPngBtn.addEventListener('click', () => {
    playSuccessSound();
    const dataUrl = socialCardCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `RiskMargin_Setup_${state.assetSymbol.replace('/', '_')}.png`;
    a.click();
    showToast('Graphic setup card downloaded!');
  });

  copyCardClipboardBtn.addEventListener('click', () => {
    playSuccessSound();
    socialCardCanvas.toBlob(blob => {
      try {
        navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        showToast('Graphic card copied to clipboard!');
      } catch (e) {
        showToast('Browser does not support direct image copying.');
      }
    });
  });

  // --- Saved Trades Log Journal ---
  saveTradeBtn.addEventListener('click', () => {
    playSuccessSound();
    const posSizeUsd = state.riskUsd / (state.slPercent / 100);
    const reqMarginUsd = posSizeUsd / state.leverage;

    const tradeItem = {
      id: Date.now(),
      dir: state.direction.toUpperCase(),
      asset: state.assetSymbol,
      riskUsd: state.riskUsd,
      slPct: state.slPercent,
      leverage: state.leverage,
      posSizeUsd: posSizeUsd,
      marginUsd: reqMarginUsd,
      status: 'PENDING', // 'WIN', 'LOSS', 'PENDING'
      realizedPnlUsd: 0
    };

    state.savedTrades.unshift(tradeItem);
    localStorage.setItem('riskmargin_pro_trades', JSON.stringify(state.savedTrades));
    renderTradesJournalTable();
    showToast('Trade saved to Journal log!');
  });

  clearLogBtn.addEventListener('click', () => {
    if (confirm('Clear all saved trade history log?')) {
      playClickSound();
      state.savedTrades = [];
      localStorage.removeItem('riskmargin_pro_trades');
      renderTradesJournalTable();
      showToast('Trade history cleared.');
    }
  });

  exportCsvBtn.addEventListener('click', () => {
    if (state.savedTrades.length === 0) {
      showToast('No trade records to export.');
      return;
    }
    playSuccessSound();
    let csv = 'ID,Direction,Asset,RiskUsd,SL_Percent,Leverage,PositionUsd,MarginUsd,Status,RealizedPnlUsd\n';
    state.savedTrades.forEach(t => {
      csv += `${t.id},${t.dir},${t.asset},${t.riskUsd},${t.slPct},${t.leverage},${t.posSizeUsd.toFixed(2)},${t.marginUsd.toFixed(2)},${t.status},${t.realizedPnlUsd}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RiskMargin_Journal_${Date.now()}.csv`;
    a.click();
    showToast('Journal exported to CSV file!');
  });

  function renderTradesJournalTable() {
    let totalWins = 0;
    let totalLosses = 0;
    let netPnl = 0;
    let grossProfits = 0;
    let grossLosses = 0;

    state.savedTrades.forEach(t => {
      if (t.status === 'WIN') {
        totalWins++;
        const p = t.realizedPnlUsd || (t.riskUsd * 2);
        netPnl += p;
        grossProfits += p;
      } else if (t.status === 'LOSS') {
        totalLosses++;
        const l = t.realizedPnlUsd || t.riskUsd;
        netPnl -= l;
        grossLosses += l;
      }
    });

    const totalResolved = totalWins + totalLosses;
    const winRate = totalResolved > 0 ? (totalWins / totalResolved) * 100 : 0;
    const pf = grossLosses > 0 ? (grossProfits / grossLosses).toFixed(2) : (grossProfits > 0 ? 'INF' : '1.0');

    jstatTotal.textContent = state.savedTrades.length;
    jstatWinRate.textContent = `${winRate.toFixed(1)}%`;
    jstatTotalPnl.textContent = fmtVal(netPnl);
    jstatTotalPnl.className = netPnl >= 0 ? 'gain' : 'loss';
    jstatProfitFactor.textContent = pf;

    if (state.savedTrades.length === 0) {
      tradesTableBody.innerHTML = `
        <tr class="empty-row">
          <td colspan="10">No saved trades in log. Click "Save Current Trade Setup" above to track setups.</td>
        </tr>`;
      return;
    }

    tradesTableBody.innerHTML = state.savedTrades.map(t => `
      <tr>
        <td><span class="dir-badge ${t.dir.toLowerCase()}">${t.dir}</span></td>
        <td><strong>${t.asset}</strong></td>
        <td>${fmtVal(t.riskUsd)}</td>
        <td>${t.slPct.toFixed(2)}%</td>
        <td>${t.leverage}x</td>
        <td>${fmtVal(t.posSizeUsd)}</td>
        <td><strong>${fmtVal(t.marginUsd)}</strong></td>
        <td>
          <select class="status-select" onchange="updateTradeStatus(${t.id}, this.value)">
            <option value="PENDING" ${t.status === 'PENDING' ? 'selected' : ''}>PENDING</option>
            <option value="WIN" ${t.status === 'WIN' ? 'selected' : ''}>WIN</option>
            <option value="LOSS" ${t.status === 'LOSS' ? 'selected' : ''}>LOSS</option>
          </select>
        </td>
        <td class="${t.status === 'WIN' ? 'gain' : (t.status === 'LOSS' ? 'loss' : '')}">
          ${t.status === 'WIN' ? '+' : (t.status === 'LOSS' ? '-' : '')}${fmtVal(Math.abs(t.realizedPnlUsd || 0))}
        </td>
        <td>
          <button class="delete-trade-btn" onclick="deleteTrade(${t.id})" title="Delete entry">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  window.updateTradeStatus = function (id, newStatus) {
    const item = state.savedTrades.find(t => t.id === id);
    if (item) {
      item.status = newStatus;
      if (newStatus === 'WIN') {
        const val = prompt('Enter realized profit ($):', (item.riskUsd * 2).toFixed(2));
        item.realizedPnlUsd = parseFloat(val) || (item.riskUsd * 2);
      } else if (newStatus === 'LOSS') {
        item.realizedPnlUsd = item.riskUsd;
      } else {
        item.realizedPnlUsd = 0;
      }
      localStorage.setItem('riskmargin_pro_trades', JSON.stringify(state.savedTrades));
      renderTradesJournalTable();
      showToast('Trade status updated.');
    }
  };

  window.deleteTrade = function (id) {
    playClickSound();
    state.savedTrades = state.savedTrades.filter(t => t.id !== id);
    localStorage.setItem('riskmargin_pro_trades', JSON.stringify(state.savedTrades));
    renderTradesJournalTable();
    showToast('Trade removed from log.');
  };

  function showToast(msg) {
    toastMsg.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => { toast.classList.add('hidden'); }, 2800);
  }

  // --- Initial Launch Setup ---
  updateCurrencyLabels();
  renderTradesJournalTable();
  calculateTrade();
});
