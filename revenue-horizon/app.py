"""
Revenue Horizon - AI-Driven 5-Year Revenue Forecasting Engine
Main application entry point
"""

import sys
import json
import numpy as np
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

from data_loader import DataLoader
from forecasting_engine import ForecastingEngine
from market_model import MarketModel
from privacy_model import PrivacyModel
from integrity_model import IntegrityModel
from visualization import ChartGenerator


def print_section(title):
    """Print formatted section header."""
    print(f"\n{'='*80}")
    print(f"  {title}")
    print(f"{'='*80}\n")


def print_subsection(title):
    """Print formatted subsection header."""
    print(f"\n{title}")
    print(f"{'-'*len(title)}\n")


def format_currency(value):
    """Format value as currency."""
    if value >= 1:
        return f"${value:.2f}B"
    else:
        return f"${value*1000:.0f}M"


def main():
    """Main execution function."""
    # Setup
    base_dir = Path(__file__).parent
    config_path = base_dir / 'config' / 'default_config.json'
    charts_dir = base_dir / 'presentation' / 'charts'

    print_section("Revenue Horizon - AI-Driven Forecasting Engine")
    print(f"Config: {config_path}")
    print(f"Charts: {charts_dir}")

    # Load configuration
    print_subsection("1. Loading Configuration")
    data_loader = DataLoader(str(config_path))
    print(f"✓ Configuration loaded")
    print(f"  Base year: {data_loader.base_year}")
    print(f"  Forecast horizon: {data_loader.forecast_horizon} years")
    print(f"  Forecast end year: {data_loader.forecast_end_year}")

    # Historical data summary
    print_subsection("2. Historical Revenue Data")
    hist_df = data_loader.get_historical_revenue_df()
    for _, row in hist_df.iterrows():
        growth = f" (+{row['yoy_growth']*100:.1f}%)" if not np.isnan(row['yoy_growth']) else ""
        print(f"  {int(row['year'])}: {format_currency(row['revenue'])}{growth}")

    # Initialize models
    print_subsection("3. Initializing Models")
    engine = ForecastingEngine(data_loader, scenario='base')
    market_model = MarketModel(data_loader)
    privacy_model = PrivacyModel(data_loader)
    integrity_model = IntegrityModel(data_loader)
    print("✓ Forecasting engine initialized")
    print("✓ Market model initialized")
    print("✓ Privacy model initialized")
    print("✓ Integrity model initialized")

    # Run deterministic forecast
    print_subsection("4. Running Deterministic Forecast (Base Case)")
    forecast = engine.forecast_total_revenue(scenario='base')

    print("\nRevenue Forecast:")
    print(f"{'Year':<8} {'Traditional':<15} {'AI Total':<15} {'Total':<15}")
    print("-" * 53)

    years = engine.years
    ai_total_by_year = {}
    for year in years:
        traditional = forecast['traditional'][year]
        total = forecast['total'][year]
        ai_total = total - traditional
        ai_total_by_year[year] = ai_total

        print(f"{year:<8} {format_currency(traditional):<15} {format_currency(ai_total):<15} {format_currency(total):<15}")

    # 5-year totals
    traditional_5yr = sum(forecast['traditional'].values())
    ai_5yr = sum(ai_total_by_year.values())
    total_5yr = sum(forecast['total'].values())

    print("\n5-Year Totals:")
    print(f"  Traditional: {format_currency(traditional_5yr)}")
    print(f"  AI Channels: {format_currency(ai_5yr)}")
    print(f"  Total Revenue: {format_currency(total_5yr)}")
    print(f"  AI Mix: {ai_5yr/total_5yr*100:.1f}%")

    # AI Channel breakdown (final year)
    print_subsection("5. AI Channel Contribution (Final Year)")
    final_year = years[-1]
    ai_channels = [k for k in forecast.keys() if k not in ['traditional', 'total']]

    channel_contribs = []
    for channel in ai_channels:
        contrib = forecast[channel][final_year]
        if contrib > 0:
            channel_contribs.append((channel, contrib))

    channel_contribs.sort(key=lambda x: x[1], reverse=True)
    for channel, contrib in channel_contribs:
        pct = contrib / forecast['total'][final_year] * 100 if forecast['total'][final_year] > 0 else 0
        print(f"  {channel:<25} {format_currency(contrib):<15} {pct:>5.1f}%")

    # Monte Carlo Analysis
    print_subsection("6. Monte Carlo Simulation (10,000 runs)")
    outcomes, mc_stats = engine.run_monte_carlo_simulation(forecast, num_simulations=10000)

    print(f"\n5-Year Revenue Distribution (Final Year {final_year}):")
    final_outcomes = outcomes[:, -1]
    print(f"  P10 (10th percentile):  {format_currency(mc_stats['p10'][-1])}")
    print(f"  P25 (25th percentile):  {format_currency(mc_stats['p25'][-1])}")
    print(f"  Mean:                   {format_currency(mc_stats['mean'][-1])}")
    print(f"  Median (P50):           {format_currency(mc_stats['median'][-1])}")
    print(f"  P75 (75th percentile):  {format_currency(mc_stats['p75'][-1])}")
    print(f"  P90 (90th percentile):  {format_currency(mc_stats['p90'][-1])}")
    print(f"  Std Dev:                {format_currency(mc_stats['std'][-1])}")
    print(f"  Range (P10-P90):        {format_currency(mc_stats['p90'][-1] - mc_stats['p10'][-1])}")

    # Market Analysis
    print_subsection("7. Market Analysis")
    tam = market_model.project_tam()
    company_share, share_diagnostics = market_model.project_market_share()

    print(f"\nTotal Digital Ad Market (TAM):")
    print(f"  2024: {format_currency(tam[2024])}")
    print(f"  2030: {format_currency(tam[2030])}")
    cagr = (tam[2030] / tam[2024]) ** (1/6) - 1
    print(f"  CAGR: {cagr*100:.1f}%")

    print(f"\nCompany Market Share:")
    print(f"  2024: {company_share[2024]*100:.1f}%")
    print(f"  2030: {company_share[2030]*100:.1f}%")
    print(f"\nShare Dynamics:")
    print(f"  Base share: {share_diagnostics['base_share']*100:.1f}%")
    print(f"  Total tailwinds: +{share_diagnostics['total_tailwinds']*100:.2f}% annual")
    print(f"  Total headwinds: {share_diagnostics['total_headwinds']*100:.2f}% annual")
    print(f"  Moat multiplier: {share_diagnostics['moat_multiplier']:.3f}x")

    # Top-down vs Bottom-up Reconciliation
    print_subsection("8. Top-Down vs Bottom-Up Reconciliation")
    top_down_revenue = {year: tam[year] * company_share[year] for year in years}
    bottom_up_revenue = forecast['total']

    reconc = market_model.reconcile_top_down_bottom_up(tam, company_share, bottom_up_revenue)

    print(f"\n{'Year':<8} {'TAM':<15} {'Share':<10} {'Top-Down':<15} {'Bottom-Up':<15} {'Gap':<12}")
    print("-" * 75)

    for year in years:
        r = reconc[year]
        print(f"{year:<8} {format_currency(r['tam']):<15} {r['company_share']*100:>8.1f}% "
              f"{format_currency(r['top_down_revenue']):<15} {format_currency(r['bottom_up_revenue']):<15} "
              f"{r['gap_pct']*100:>+6.1f}%")

    # Privacy Analysis
    print_subsection("9. Privacy Impact Analysis")
    privacy_mults = privacy_model.compute_privacy_multipliers_all_regions()
    compliance_costs = privacy_model.compute_compliance_costs(forecast['total'])

    print(f"\nPrivacy Multipliers (impact on revenue) - 2030:")
    for region in ['us_canada', 'europe', 'apac', 'rest_of_world']:
        mult = privacy_mults[region][2030]
        loss = (1.0 - mult) * 100
        print(f"  {region:<20} {mult:.2%} ({loss:.1f}% revenue loss)")

    print(f"\nCompliance Costs:")
    print(f"  2024: {format_currency(compliance_costs[2024])}")
    print(f"  2030: {format_currency(compliance_costs[2030])}")
    print(f"  5-Year Total: {format_currency(sum(compliance_costs.values()))}")

    # Integrity Analysis
    print_subsection("10. Integrity & Brand Safety Analysis")
    content_scores = integrity_model.compute_content_quality_score()
    integrity_scores = integrity_model.compute_integrity_investment_impact(content_scores)
    cpm_multipliers = integrity_model.compute_cpm_multiplier(integrity_scores)

    print(f"\nIntegrity Score Evolution:")
    print(f"  2024: {content_scores[2024]:.1f}/100")
    print(f"  2030: {integrity_scores[2030]:.1f}/100")

    print(f"\nCPM Multiplier Impact:")
    print(f"  2024: {cpm_multipliers[2024]:.2%}")
    print(f"  2030: {cpm_multipliers[2030]:.2%}")

    # Sensitivity Analysis
    print_subsection("11. Sensitivity Analysis")
    sensitivity = engine.compute_sensitivity_analysis(forecast, year_target=2030)

    print(f"\nParameter Sensitivity (5-year revenue impact):")
    for param, (low, high) in sensitivity.items():
        print(f"  {param:<30} [{low:>+.1%}, {high:>+.1%}]")

    # Generate Charts
    print_subsection("12. Generating Visualizations")
    charts_dir.mkdir(parents=True, exist_ok=True)

    chart_gen = ChartGenerator(str(charts_dir))

    print("  Generating revenue waterfall...")
    chart_gen.revenue_waterfall(forecast, years)

    print("  Generating Monte Carlo distribution...")
    chart_gen.monte_carlo_distribution(outcomes, years, mc_stats)

    print("  Generating sensitivity tornado...")
    chart_gen.sensitivity_tornado(sensitivity)

    # AI adoption curves
    print("  Generating AI adoption S-curves...")
    adoption_curves = {}
    for channel_id in data_loader.config['ai_channels'].keys():
        adoption_curves[channel_id] = {}
        for year in years:
            adoption_curves[channel_id][year] = engine.compute_ai_channel_adoption(channel_id, year)
    chart_gen.ai_adoption_curves(adoption_curves, years)

    print("  Generating market share trend...")
    chart_gen.market_share_trend(company_share, years)

    print("  Generating privacy multiplier by region...")
    chart_gen.privacy_multiplier_by_region(privacy_mults, years)

    print("  Generating top-down vs bottom-up reconciliation...")
    chart_gen.top_down_bottom_up_reconciliation(top_down_revenue, bottom_up_revenue, years)

    print(f"✓ All charts saved to {charts_dir}")

    # Final Summary
    print_section("Executive Summary")

    print(f"""
BASE CASE FORECAST (2024-2030)

Revenue Growth:
  • 2024 Baseline: {format_currency(hist_df.iloc[-1]['revenue'])}
  • 2030 Forecast: {format_currency(forecast['total'][2030])}
  • 5-Year Total: {format_currency(total_5yr)}
  • CAGR: {((forecast['total'][2030] / hist_df.iloc[-1]['revenue']) ** (1/6) - 1)*100:.1f}%

AI Contribution:
  • 2030 AI Revenue: {format_currency(ai_total_by_year[2030])}
  • AI as % of Total: {ai_total_by_year[2030]/forecast['total'][2030]*100:.1f}%
  • 5-Year AI Total: {format_currency(ai_5yr)}

Market Position:
  • Market Share 2024: {company_share[2024]*100:.1f}%
  • Market Share 2030: {company_share[2030]*100:.1f}%
  • TAM Growth (CAGR): {((tam[2030]/tam[2024])**(1/6)-1)*100:.1f}%

Risk & Uncertainty:
  • P10 Revenue (2030): {format_currency(mc_stats['p10'][-1])}
  • P50 Revenue (2030): {format_currency(mc_stats['median'][-1])}
  • P90 Revenue (2030): {format_currency(mc_stats['p90'][-1])}
  • Range (P10-P90): {format_currency(mc_stats['p90'][-1] - mc_stats['p10'][-1])}

Key Risks:
  • Privacy signal loss: -{(1.0 - privacy_mults['us_canada'][2030])*100:.1f}% in US/Canada
  • Regulatory drag: -5.0% (base case)
  • Competition intensity: Could reduce growth by 15% in bear case
""")

    print_section("Analysis Complete")
    print(f"✓ All outputs generated successfully")
    print(f"✓ Charts saved to: {charts_dir}\n")


if __name__ == '__main__':
    main()
