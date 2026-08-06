# ⚡ RiskMargin PRO — Futures Position Sizing & Margin Calculator

> A modern, high-performance, dark-themed position sizing & margin calculator for crypto and futures leverage trading. Calculate exact position sizes, required margin, effective loss on margin, and liquidation safety based on fixed dollar risk.

---

## 🎯 Features

- **⚡ Instant Real-Time Calculations**: Calculates position size and required margin as you type or adjust sliders.
- **💰 Fixed Dollar Risk Management**: Input your exact max loss ($) per trade to protect your capital.
- **🔄 Dual Calculation Modes**:
  - **Quick % Mode**: Calculate using percentage distance away (e.g., 2% SL).
  - **Exact Price Mode**: Input entry and stop-loss prices for precise coin quantity calculation.
- **🛡️ Liquidation Safety Guard**: Automatically detects if your Stop Loss distance is wider than your estimated Liquidation price.
- **🎯 Take Profit & R:R Planner**: Calculates profit targets and prices for 1:1, 1:2, 1:3, 1:4, and 1:5 Risk/Reward setups.
- **🎛️ Quick Preset Chips**: 1-tap presets for Risk ($10, $25, $50, $100), SL% (0.5%, 1%, 2%, 3%, 5%), and Leverage (5x, 10x, 20x, 50x, 100x).
- **📋 1-Click Setup Copy**: Copy beautifully formatted trade setups for Discord, Telegram, or trading journals.
- **📓 Built-in Trade Journal**: Save position calculations to browser `localStorage` with a clean history table.
- **🌙 Dark/Light Theme**: Sleek crypto trading terminal aesthetic with glassmorphism design.

---

## 🧮 How The Math Works

### 1. Position Size ($)
$$\text{Position Size} = \frac{\text{Fixed Risk (\$)}}{\text{Stop Loss (\%)}}$$
*Example: \$25 \text{ Risk} / 2\% (0.02) = \mathbf{\$1,250.00 \text{ Position Size}}*

### 2. Required Margin ($)
$$\text{Required Margin} = \frac{\text{Position Size}}{\text{Leverage}}$$
*Example: \$1,250.00 \text{ Position} / 20\text{x Leverage} = \mathbf{\$62.50 \text{ Margin}}*

### 3. Loss on Margin (%)
$$\text{Loss on Margin (\%)} = \text{Stop Loss (\%)} \times \text{Leverage}$$
*Example: 2\% \text{ SL} \times 20\text{x Leverage} = \mathbf{40\% \text{ Loss of Margin}} if stop loss is hit.*

### 4. Liquidation Distance (%)
$$\text{Estimated Liquidation Distance} \approx \frac{100\%}{\text{Leverage}}$$
*Example: 100\% / 20\text{x} = \mathbf{\sim 5.0\% \text{ away from entry}}*
