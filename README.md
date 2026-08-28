# ⚡ RiskMargin PRO — Institutional Crypto Futures Terminal & Risk Engine

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge" alt="MIT License">
  <img src="https://img.shields.io/badge/Build-Zero_Dependencies-06b6d4?style=for-the-badge" alt="Zero Dependencies">
  <img src="https://img.shields.io/badge/API-Binance_Public_REST-fbbf24?style=for-the-badge" alt="Binance API">
  <img src="https://img.shields.io/badge/Engine-HTML5_Canvas-10b981?style=for-the-badge" alt="HTML5 Canvas Engine">
  <img src="https://img.shields.io/badge/Audio-Web_Audio_API-f59e0b?style=for-the-badge" alt="Web Audio API">
</p>

> **RiskMargin PRO** is a next-generation, institutional-grade position sizing terminal and risk management suite built for crypto futures and leverage traders. Unlike simple calculators, RiskMargin PRO combines **real-time live market ticker feeds**, an **AI Automated Trade Auditor**, **HTML5 Canvas visual price charts**, **Multi-Target Partial TP Exits**, **Kelly Criterion Portfolio Risk Simulators**, and **1-Click Social Setup Card Exporting** into a zero-dependency, ultra-fast web application.

---

## 🌟 Key Features Overview

| Feature | Description | Key Advantage |
| :--- | :--- | :--- |
| **🔴 Live Market Prices** | Streams real-time prices for BTC, ETH, SOL, BNB, XRP, DOGE, SUI via Binance public API. | 1-Click **Sync Entry Price** auto-fills entry levels directly from live markets. |
| **🤖 AI Trade Auditor** | Evaluates setup parameters (R:R ratio, liquidation safety margin, fee burden %, leverage risk). | Produces an instant **Trade Grade (A+, A, B, C, D, F)** with actionable pro advice. |
| **📊 Canvas Visualizer** | Interactive HTML5 Canvas rendering Entry, TP, SL, and Liquidation levels. | Shaded green Reward vs red Risk zones visualizes trade geometry instantly. |
| **🎯 Multi-TP Exit Ladder** | Divide position exits across 3 targets (TP1 30%, TP2 50%, TP3 20%). | Calculates tiered coin exits, realized profit $, blended R:R, and breakeven SL hints. |
| **🛡️ Portfolio & Kelly** | Position sizing based on % account risk limit + Half-Kelly optimal sizing. | Includes an 8-level Drawdown Survival & Consecutive Loss recovery matrix. |
| **🌊 Market Shock Stress** | Interactive shock slider (-25% to +25%) simulating market drops or pumps. | Real-time floating PnL ($), ROE %, liquidation hazard alert & 8h/24h/7d funding fees. |
| **📸 Social Setup Exporter** | 1-click 1200x675 glassmorphic graphic setup card generator. | Download PNG or copy graphic card directly to clipboard for Telegram/Discord/Twitter. |
| **💱 Multi-Currency Switcher**| Live currency conversion for USD ($), EUR (€), GBP (£), CAD (CA$), AUD (A$), INR (₹), JPY (¥), PKR (Rs). | View all risks, margins, and profits in your local native currency. |
| **🔊 Cyberpunk Audio FX** | Web Audio API synthesized sound effects (zero audio assets to load). | Soft UI click chirps, warning alert chimes on liquidation danger, success notifications. |
| **📓 Pro Trade Journal** | LocalStorage trade logging with outcome tagging (`PENDING`, `WIN`, `LOSS`). | Real-time Win Rate %, Net Realized PnL, Profit Factor & 1-Click CSV export. |

---

## 🧮 Mathematical Engine & Formulas

### 1. Position Size ($)
$$\text{Position Size (\$)} = \frac{\text{Fixed Risk (\$)}}{\text{Stop Loss Distance (\%) / 100}}$$
*Example: $\$25 \text{ Risk} / 0.02 (2\% \text{ SL}) = \mathbf{\$1,250.00 \text{ Position Size}}$*

### 2. Required Margin ($)
$$\text{Required Margin (\$)} = \frac{\text{Position Size (\$)}}{\text{Leverage}} + \text{Estimated Taker Fees (\$)}$$
*Example: $\$1,250.00 / 20\text{x Leverage} = \mathbf{\$62.50 \text{ Required Margin}}$*

### 3. Loss on Margin (%)
$$\text{Loss on Margin (\%)} = \text{Stop Loss (\%)} \times \text{Leverage}$$
*Example: $2\% \text{ SL} \times 20\text{x Leverage} = \mathbf{40\% \text{ Loss of Margin}}$ if stop loss is hit.*

### 4. Estimated Liquidation Distance (%)
$$\text{Estimated Liquidation Distance (\%)} \approx \frac{100\%}{\text{Leverage}}$$
*Example: $100\% / 20\text{x} = \mathbf{\sim 5.0\% \text{ away from entry}}$*

### 5. Fractional Kelly Criterion Sizing (%)
$$K_{\%}^* = \frac{W \cdot (R + 1) - 1}{R}$$
*Where $W$ = Strategy Win Rate %, $R$ = Target Risk/Reward Ratio. Half-Kelly $K_{\%}^* / 2$ is enforced for capital preservation.*

---

## 🚀 Quick Start / How to Run

### Option 1: Direct Browser Launch (Zero Install)
Simply double-click `index.html` in any browser (Chrome, Firefox, Edge, Safari, Brave). No build tools, npm, or installation required!

### Option 2: Local Web Server

Using Python:
```bash
python -m http.server 8080
```

Using Node.js `npx http-server`:
```bash
npx http-server . -p 8080
```

Then navigate to `http://localhost:8080` in your web browser.

---

## 🛠️ Architecture & Tech Stack

- **HTML5 & Canvas API**: Native 2D canvas drawing routines for high-DPI retina display rendering.
- **CSS3 Design System**: Custom variables, glassmorphic backdrop filters, CSS Grid/Flexbox, dynamic glowing accents.
- **Vanilla JavaScript (ES6+)**: Zero-dependency reactive state engine with event-driven data flow.
- **Web Audio API**: Browser-native sound synthesizer for zero-latency audio feedback.
- **Binance Public REST API**: Zero-authentication public endpoint for real-time crypto prices.
- **FontAwesome & Google Fonts**: Inter (sans-serif) & JetBrains Mono (monospace) typography.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — free to use, modify, distribute, and embed in commercial or personal applications.
