# Revenue Horizon

**AI-Driven 5-Year Revenue Forecasting Framework for Digital Advertising Platforms**

Revenue Horizon is a comprehensive strategic forecasting framework that models how AI adoption reshapes revenue trajectories for large-scale digital advertising businesses. It combines time-series forecasting, AI adoption S-curves, Monte Carlo simulation, and multi-dimensional impact analysis to produce executive-ready 5-year revenue projections.

## Key Features

- **Multi-Layer Forecasting Engine**: Baseline time-series extrapolation + AI revenue overlay + risk quantification
- **6 AI Revenue Channels**: AI Targeting, AI Creative, AI-Native Surfaces, AI Messaging, AI Infrastructure, AI Measurement — each with independent S-curve adoption models
- **Cannibalization Matrix**: Cross-channel impact modeling showing net incremental revenue after displacement effects
- **Market Share Dynamics**: Top-down TAM analysis with competitive moat scoring, share tailwinds/headwinds, and bottom-up reconciliation
- **Privacy Impact Model**: Signal loss/recovery lifecycle with region-specific privacy-adjusted revenue multipliers
- **Integrity & Trust Model**: Content quality scoring, brand safety incident modeling, CPM sensitivity to integrity investment
- **Monte Carlo Simulation**: 10,000-run stochastic simulation with configurable parameter distributions
- **Sensitivity Analysis**: Tornado charts identifying highest-impact parameters
- **Scenario Planning**: Bull/Base/Bear cases with full parameter override
- **Interactive Demo**: React-based executive dashboard with real-time configuration

## Project Structure

```
revenue-horizon/
├── README.md
├── requirements.txt
├── app.py                          # Main entry point — runs all models, generates charts
├── config/
│   └── default_config.json         # All configurable parameters (100+ knobs)
├── src/
│   ├── __init__.py
│   ├── data_loader.py              # Config & historical data loading
│   ├── forecasting_engine.py       # Core: S-curves, baseline, Monte Carlo, sensitivity
│   ├── market_model.py             # TAM, market share, competitive dynamics
│   ├── privacy_model.py            # Signal degradation & recovery, compliance costs
│   ├── integrity_model.py          # Content quality, brand safety, CPM impact
│   └── visualization.py            # Chart generation (matplotlib)
├── demo/
│   └── RevenueHorizonApp.jsx       # Interactive React dashboard
├── presentation/
│   ├── generate_deck.py            # PowerPoint generation script
│   ├── Revenue_Horizon_Executive_Deck.pptx
│   └── charts/                     # Generated chart PNGs
└── docs/
    └── plans/
```

## Quick Start

### Run the Forecasting Engine

```bash
pip install pandas numpy matplotlib python-pptx
python app.py
```

This will:
1. Load configuration and historical data
2. Run baseline forecasting + AI channel projections
3. Apply cannibalization and compute net revenue
4. Run Monte Carlo simulation (10,000 iterations)
5. Generate all analytical charts
6. Print executive summary to console

### Generate the Executive Deck

```bash
python presentation/generate_deck.py
```

### Interactive Demo

The `demo/RevenueHorizonApp.jsx` file is a self-contained React component designed for deployment as a web artifact. It provides a fully interactive dashboard with 6 tabs covering executive summary, market analysis, AI impact, privacy/integrity, risk modeling, and live configuration.

## Analytical Framework

### Revenue Decomposition

```
Total Revenue = Traditional Feed Revenue
              + AI Targeting Uplift
              + AI Creative (SMB Expansion)
              + AI-Native Surfaces (Net-New Inventory)
              + AI Business Messaging
              + AI Infrastructure (Enterprise APIs)
              + AI Measurement (Signal Recovery)
              - Cross-Channel Cannibalization
              × Privacy Multiplier
              × Integrity Score Multiplier
```

### AI Adoption Model

Each AI channel follows a logistic S-curve: `adoption(t) = ceiling / (1 + exp(-k × (t - inflection)))` where ceiling is the maximum adoption rate, k controls steepness, and inflection is the midpoint year.

### Risk Quantification

Monte Carlo simulation samples from distributions across 5 key uncertainty dimensions: macro growth, AI adoption speed, competitive intensity, regulatory drag, and privacy signal loss. Output is a full probability distribution of 5-year revenue outcomes with P10/P50/P90 confidence intervals.

### Privacy-Adjusted Revenue

```
Privacy Multiplier = Base Signal Quality × (1 - Signal Loss) × (1 + AI Recovery)
```

Applied per region per year to capture geographic variation in privacy regulation impact.

## Configuration

All 100+ parameters are configurable via `config/default_config.json`. Key sections:

| Section | Parameters | Description |
|---------|-----------|-------------|
| `scenarios` | Bull/Base/Bear definitions | Macro growth premiums, AI acceleration, regulatory drag |
| `ai_channels` | 6 channels × ~5 params each | Adoption ceiling, inflection year, revenue impact rates |
| `cannibalization_matrix` | 6×6 cross-impact rates | Channel displacement and synergy coefficients |
| `market` | TAM, share, competitors | Market growth, format mix, competitive moat scores |
| `privacy` | Signal loss & recovery | OS restrictions, regulatory consent, AI recovery mechanisms |
| `integrity` | Content risks & investment | Misinformation rates, brand safety, CPM sensitivity |
| `monte_carlo` | Simulation parameters | Distribution types, standard deviations, seed |

## Data Sources

Historical advertising revenue data sourced from public SEC 10-K filings (2019-2024). Market sizing estimates based on industry analyst reports. All forward projections are model-generated.

## License

MIT
