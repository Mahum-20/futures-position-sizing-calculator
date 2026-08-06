/* ==========================================================================
   APP ENGINE - RISKMARGIN PRO (CRYPTO FUTURES CALCULATOR)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  
  // --- DOM Elements ---
  const calcForm = document.getElementById('calcForm');
  const riskInput = document.getElementById('riskInput');
  const slPercentInput = document.getElementById('slPercentInput');
  const slPercentSlider = document.getElementById('slPercentSlider');
  const slPercentValDisplay = document.getElementById('slPercentValDisplay');
  const leverageInput = document.getElementById('leverageInput');
  const leverageSlider = document.getElementById('leverageSlider');
  const leverageValDisplay = document.getElementById('leverageValDisplay');

  // Price Mode Elements
  const entryPriceInput = document.getElementById('entryPriceInput');
  const slPriceInput = document.getElementById('slPriceInput');
  const computedSlHint = document.getElementById('computedSlHint');
  const entryPriceOpt = document.getElementById('entryPriceOpt');

  // Direction Radios
  const dirLongRadio = document.getElementById('dirLong');
  const dirShortRadio = document.getElementById('dirShort');

  // Options & Mode Switchers
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
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const copySummaryBtn = document.getElementById('copySummaryBtn');
  const saveTradeBtn = document.getElementById('saveTradeBtn');
  const clearLogBtn = document.getElementById('clearLogBtn');

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

  // Visual Gauge Elements
  const gaugeMarginBar = document.getElementById('gaugeMarginBar');
  const gaugeBorrowedBar = document.getElementById('gaugeBorrowedBar');
  const gaugeMarginPct = document.getElementById('gaugeMarginPct');
  const gaugeBorrowedVal = document.getElementById('gaugeBorrowedVal');

  // Take Profit Elements
  const tpRewardVal = document.getElementById('tpRewardVal');
  const tpDistanceVal = document.getElementById('tpDistanceVal');
  const tpRomVal = document.getElementById('tpRomVal');
  const tpPriceVal = document.getElementById('tpPriceVal');

  // Price Level Visualizer Elements
  const dirBadge = document.getElementById('dirBadge');
  const vizTpPrice = document.getElementById('vizTpPrice');
  const vizTpDiff = document.getElementById('vizTpDiff');
  const vizEntryPrice = document.getElementById('vizEntryPrice');
  const vizSlPrice = document.getElementById('vizSlPrice');
  const vizSlDiff = document.getElementById('vizSlDiff');
  const vizLiqPrice = document.getElementById('vizLiqPrice');
  const vizLiqDiff = document.getElementById('vizLiqDiff');

  // Saved Trades Journal Elements
  const tradeCountBadge = document.getElementById('tradeCountBadge');
  const tradesTableBody = document.getElementById('tradesTableBody');
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');

  // --- App State ---
  let state = {
    mode: 'percentage', // 'percentage' or 'price'
    direction: 'long',
    risk: 25,
    slPercent: 2.0,
    entryPrice: 65000,
    slPrice: 63700,
    leverage: 20,
    selectedRR: 2,
    assetSymbol: 'BTC/USDT',
    includeFees: false,
    savedTrades: JSON.parse(localStorage.getItem('riskmargin_trades') || '[]')
  };

  // --- Calculations ---
  function calculateTrade() {
    // 1. Determine SL % based on current mode
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

    state.risk = Math.max(0.01, parseFloat(riskInput.value) || 25);
    state.leverage = Math.max(1, parseInt(leverageInput.value) || 20);
    state.direction = dirLongRadio.checked ? 'long' : 'short';
    state.assetSymbol = assetSymbolInput.value.trim() || 'BTC/USDT';
    state.includeFees = includeFeesCheckbox.checked;

    // 2. Primary Math Formulas
    const slDecimal = state.slPercent / 100;
    
    // Position Size ($) = Risk ($) / SL (%)
    let positionSize = state.risk / slDecimal;

    // Fees calculation (0.05% taker fee entry + 0.05% exit = 0.1% total)
    const estimatedFee = positionSize * 0.001;

    // Required Margin ($) = Position Size ($) / Leverage
    let requiredMargin = positionSize / state.leverage;

    if (state.includeFees) {
      // Add fee to required margin for true total capital required
      requiredMargin += estimatedFee;
    }

    // Loss on Margin (%) = (Risk / Margin) * 100% = SL% * Leverage
    const lossOnMarginPct = state.slPercent * state.leverage;

    // Estimated Liquidation Distance (%) ≈ 100% / Leverage
    const liqDistancePct = (100 / state.leverage);

    // Entry price selection (from price mode or optional input)
    let activeEntryPrice = state.mode === 'price' 
      ? state.entryPrice 
      : (parseFloat(entryPriceOpt.value) || 65000);

    // Calculated Prices
    let calculatedSlPrice = 0;
    let calculatedLiqPrice = 0;
    let coinQuantity = 0;

    if (activeEntryPrice > 0) {
      coinQuantity = positionSize / activeEntryPrice;
      
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
    const targetReward = state.risk * state.selectedRR;
    const returnOnMarginPct = (targetReward / requiredMargin) * 100;
    let calculatedTpPrice = 0;

    if (activeEntryPrice > 0) {
      if (state.direction === 'long') {
        calculatedTpPrice = activeEntryPrice * (1 + (tpDistancePct / 100));
      } else {
        calculatedTpPrice = activeEntryPrice * (1 - (tpDistancePct / 100));
      }
    }

    // --- Update UI ---
    updateUI({
      positionSize,
      requiredMargin,
      lossOnMarginPct,
      liqDistancePct,
      estimatedFee,
      activeEntryPrice,
      calculatedSlPrice,
      calculatedLiqPrice,
      coinQuantity,
      tpDistancePct,
      targetReward,
      returnOnMarginPct,
      calculatedTpPrice
    });
  }

  function updateUI(res) {
    // Hero Section
    marginOutput.textContent = res.requiredMargin.toFixed(2);
    marginHighlight.textContent = `$${res.requiredMargin.toFixed(2)}`;
    levHighlight.textContent = state.leverage;
    riskHighlight.textContent = `$${state.risk.toFixed(2)}`;
    slHighlight.textContent = `${state.slPercent.toFixed(2)}`;

    // Visual Gauge
    const marginRatio = (1 / state.leverage) * 100;
    const borrowedRatio = 100 - marginRatio;
    const borrowedAmount = res.positionSize - res.requiredMargin;

    gaugeMarginBar.style.width = `${Math.min(100, Math.max(2, marginRatio))}%`;
    gaugeBorrowedBar.style.width = `${Math.max(0, borrowedRatio)}%`;
    gaugeMarginPct.textContent = `${marginRatio.toFixed(1)}%`;
    gaugeBorrowedVal.textContent = `$${borrowedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Metrics Grid
    positionSizeVal.textContent = `$${res.positionSize.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    // Extract base currency symbol from asset pair (e.g. BTC from BTC/USDT)
    const baseAsset = state.assetSymbol.split('/')[0] || 'COIN';
    coinQtyVal.textContent = `${res.coinQuantity.toFixed(4)} ${baseAsset}`;

    marginLossPctVal.textContent = `${res.lossOnMarginPct.toFixed(2)}%`;
    maxDollarLossVal.textContent = `$${state.risk.toFixed(2)} Loss`;
    liqDistanceVal.textContent = `~${res.liqDistancePct.toFixed(2)}%`;
    feeEstVal.textContent = `$${res.estimatedFee.toFixed(2)}`;

    // Liquidation Safety Status Check
    const isLiqDangerous = state.slPercent >= res.liqDistancePct;
    if (isLiqDangerous) {
      safetyStatusPill.className = 'status-pill danger';
      safetyStatusPill.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Liquidation Risk';
      liqAlertBox.classList.remove('hidden');
      liqAlertText.innerHTML = `Your Stop Loss (<strong>${state.slPercent.toFixed(2)}%</strong>) is equal to or further than your estimated Liquidation price (<strong>~${res.liqDistancePct.toFixed(2)}%</strong>)! You risk getting liquidated before your stop-loss order fills. Lower your leverage or tighten your stop-loss.`;
    } else {
      safetyStatusPill.className = 'status-pill safe';
      safetyStatusPill.innerHTML = '<i class="fa-solid fa-shield-halved"></i> Safe Distance';
      liqAlertBox.classList.add('hidden');
    }

    // Take Profit Card
    tpRewardVal.textContent = `+$${res.targetReward.toFixed(2)}`;
    tpDistanceVal.textContent = `+${res.tpDistancePct.toFixed(2)}%`;
    tpRomVal.textContent = `+${res.returnOnMarginPct.toFixed(2)}%`;
    tpPriceVal.textContent = `$${res.calculatedTpPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Price Level Visualizer
    dirBadge.textContent = state.direction.toUpperCase();
    dirBadge.className = `dir-badge ${state.direction}`;

    vizEntryPrice.textContent = `$${res.activeEntryPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    vizTpPrice.textContent = `$${res.calculatedTpPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    vizSlPrice.textContent = `$${res.calculatedSlPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    vizLiqPrice.textContent = `$${res.calculatedLiqPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (state.direction === 'long') {
      vizTpDiff.textContent = `+${res.tpDistancePct.toFixed(2)}% (+$${res.targetReward.toFixed(2)})`;
      vizSlDiff.textContent = `-${state.slPercent.toFixed(2)}% (-$${state.risk.toFixed(2)})`;
      vizLiqDiff.textContent = `-${res.liqDistancePct.toFixed(2)}% (-$${res.requiredMargin.toFixed(2)})`;
    } else {
      vizTpDiff.textContent = `-${res.tpDistancePct.toFixed(2)}% (+$${res.targetReward.toFixed(2)})`;
      vizSlDiff.textContent = `+${state.slPercent.toFixed(2)}% (-$${state.risk.toFixed(2)})`;
      vizLiqDiff.textContent = `+${res.liqDistancePct.toFixed(2)}% (-$${res.requiredMargin.toFixed(2)})`;
    }
  }

  // --- Event Listeners & Controls ---

  // Live calculation on input
  const allInputs = [
    riskInput, slPercentInput, leverageInput, entryPriceInput, 
    slPriceInput, entryPriceOpt, assetSymbolInput
  ];

  allInputs.forEach(input => {
    input.addEventListener('input', () => {
      syncSlidersAndInputs();
      calculateTrade();
    });
  });

  // Range Slider Sync
  slPercentSlider.addEventListener('input', () => {
    slPercentInput.value = slPercentSlider.value;
    slPercentValDisplay.textContent = `${parseFloat(slPercentSlider.value).toFixed(1)}%`;
    updateActivePresetChip(slPresets, slPercentSlider.value);
    calculateTrade();
  });

  leverageSlider.addEventListener('input', () => {
    leverageInput.value = leverageSlider.value;
    leverageValDisplay.textContent = `${leverageSlider.value}x`;
    updateActivePresetChip(leveragePresets, leverageSlider.value);
    calculateTrade();
  });

  dirLongRadio.addEventListener('change', calculateTrade);
  dirShortRadio.addEventListener('change', calculateTrade);
  includeFeesCheckbox.addEventListener('change', calculateTrade);

  function syncSlidersAndInputs() {
    const slVal = parseFloat(slPercentInput.value) || 2;
    slPercentSlider.value = Math.min(15, Math.max(0.1, slVal));
    slPercentValDisplay.textContent = `${slVal.toFixed(1)}%`;
    updateActivePresetChip(slPresets, slVal);

    const levVal = parseInt(leverageInput.value) || 20;
    leverageSlider.value = Math.min(100, Math.max(1, levVal));
    leverageValDisplay.textContent = `${levVal}x`;
    updateActivePresetChip(leveragePresets, levVal);

    updateActivePresetChip(riskPresets, parseFloat(riskInput.value) || 25);
  }

  function updateActivePresetChip(container, value) {
    container.querySelectorAll('.chip').forEach(chip => {
      if (parseFloat(chip.dataset.value) === parseFloat(value)) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });
  }

  // Preset Chips Handlers
  setupPresetGroup(riskPresets, val => {
    riskInput.value = val;
    calculateTrade();
  });

  setupPresetGroup(slPresets, val => {
    slPercentInput.value = val;
    slPercentSlider.value = val;
    slPercentValDisplay.textContent = `${parseFloat(val).toFixed(1)}%`;
    calculateTrade();
  });

  setupPresetGroup(leveragePresets, val => {
    leverageInput.value = val;
    leverageSlider.value = val;
    leverageValDisplay.textContent = `${val}x`;
    calculateTrade();
  });

  function setupPresetGroup(container, callback) {
    container.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        container.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        callback(chip.dataset.value);
      });
    });
  }

  // Mode Switching (Percentage vs Price)
  modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
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

  // Risk/Reward Buttons
  rrButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      rrButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.selectedRR = parseFloat(btn.dataset.rr);
      calculateTrade();
    });
  });

  // Advanced Accordion Toggle
  advancedToggle.addEventListener('click', () => {
    advancedContent.classList.toggle('hidden');
    const icon = advancedToggle.querySelector('.toggle-icon');
    if (advancedContent.classList.contains('hidden')) {
      icon.style.transform = 'rotate(0deg)';
    } else {
      icon.style.transform = 'rotate(180deg)';
    }
  });

  // Dark/Light Theme Toggle
  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const icon = themeToggleBtn.querySelector('i');
    if (document.body.classList.contains('light-theme')) {
      icon.className = 'fa-solid fa-sun';
    } else {
      icon.className = 'fa-solid fa-moon';
    }
  });

  // --- Copy Summary Feature ---
  copySummaryBtn.addEventListener('click', () => {
    const slVal = state.slPercent.toFixed(2);
    const textToCopy = 
`📊 *RISKMARGIN PRO TRADE SETUP* 📊
• Pair: ${state.assetSymbol} (${state.direction.toUpperCase()})
• Fixed Risk: $${state.risk.toFixed(2)}
• Stop Loss: ${slVal}% away
• Leverage: ${state.leverage}x
-----------------------------
💰 REQUIRED MARGIN: $${marginOutput.textContent} USDT
📈 Position Size: ${positionSizeVal.textContent} (${coinQtyVal.textContent})
⚠️ Loss on Margin: ${marginLossPctVal.textContent}
🎯 Target TP (1:${state.selectedRR}): ${tpPriceVal.textContent} (+${tpRewardVal.textContent})`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast('Trade setup copied to clipboard!');
    }).catch(err => {
      showToast('Failed to copy setup.');
    });
  });

  // --- Trade Log Journal ---
  saveTradeBtn.addEventListener('click', () => {
    const tradeItem = {
      id: Date.now(),
      dir: state.direction.toUpperCase(),
      asset: state.assetSymbol,
      risk: `$${state.risk.toFixed(2)}`,
      slPct: `${state.slPercent.toFixed(2)}%`,
      lev: `${state.leverage}x`,
      posSize: positionSizeVal.textContent,
      margin: `$${marginOutput.textContent}`
    };

    state.savedTrades.unshift(tradeItem);
    localStorage.setItem('riskmargin_trades', JSON.stringify(state.savedTrades));
    renderTradesTable();
    showToast('Trade saved to log!');
  });

  clearLogBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all saved trade history?')) {
      state.savedTrades = [];
      localStorage.removeItem('riskmargin_trades');
      renderTradesTable();
      showToast('Trade history cleared.');
    }
  });

  function renderTradesTable() {
    tradeCountBadge.textContent = `${state.savedTrades.length} saved`;
    if (state.savedTrades.length === 0) {
      tradesTableBody.innerHTML = `
        <tr class="empty-row">
          <td colspan="8">No saved trades yet. Click "Save Trade Setup" above to log position calculations.</td>
        </tr>`;
      return;
    }

    tradesTableBody.innerHTML = state.savedTrades.map(trade => `
      <tr>
        <td><span class="dir-badge ${trade.dir.toLowerCase()}">${trade.dir}</span></td>
        <td><strong>${trade.asset}</strong></td>
        <td>${trade.risk}</td>
        <td>${trade.slPct}</td>
        <td>${trade.lev}</td>
        <td>${trade.posSize}</td>
        <td class="gain"><strong>${trade.margin}</strong></td>
        <td>
          <button class="delete-trade-btn" onclick="deleteTrade(${trade.id})" title="Delete entry">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  window.deleteTrade = function(id) {
    state.savedTrades = state.savedTrades.filter(t => t.id !== id);
    localStorage.setItem('riskmargin_trades', JSON.stringify(state.savedTrades));
    renderTradesTable();
    showToast('Trade removed from log.');
  };

  function showToast(msg) {
    toastMsg.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 2800);
  }

  // --- Initial Launch ---
  renderTradesTable();
  calculateTrade();
});
