"""
Visualization Module
Generates matplotlib charts for embedding in PPTX presentations.
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from pathlib import Path
from typing import Dict, Tuple, List


class ColorScheme:
    """Professional color scheme for charts."""
    NAVY = '#1E2761'
    ICE_BLUE = '#7EB6D9'
    TEAL = '#0891B2'
    CORAL = '#F96167'
    GOLD = '#F5A623'
    GRAY = '#64748B'
    WHITE = '#FFFFFF'
    LIGHT_GRAY = '#F1F5F9'


class ChartGenerator:
    """Generate publication-ready charts."""

    def __init__(self, output_dir: str):
        """Initialize chart generator."""
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self._setup_style()

    def _setup_style(self):
        """Setup matplotlib style."""
        plt.style.use('default')
        plt.rcParams['figure.facecolor'] = ColorScheme.WHITE
        plt.rcParams['axes.facecolor'] = ColorScheme.LIGHT_GRAY
        plt.rcParams['font.family'] = 'sans-serif'
        plt.rcParams['font.size'] = 10

    def revenue_waterfall(self, forecast: Dict[str, Dict[int, float]], years: np.ndarray):
        """
        Generate 5-year revenue waterfall chart (stacked bar).
        Shows traditional + each AI channel contribution.
        """
        fig, ax = plt.subplots(figsize=(14, 8))

        ai_channels = [k for k in forecast.keys() if k not in ['traditional', 'total']]
        x = np.arange(len(years))
        width = 0.6

        # Prepare data
        traditional_vals = np.array([forecast['traditional'][year] for year in years])
        channel_data = {}
        for channel in ai_channels:
            channel_data[channel] = np.array([forecast[channel][year] for year in years])

        # Color mapping with more colors
        colors = [
            ColorScheme.NAVY,
            ColorScheme.ICE_BLUE,
            ColorScheme.TEAL,
            ColorScheme.CORAL,
            ColorScheme.GOLD,
            ColorScheme.GRAY,
            '#A78BFA',  # Purple
            '#34D399',  # Green
            '#F472B6',  # Pink
        ]

        # Stack bars
        bottom = traditional_vals.copy()
        ax.bar(x, traditional_vals, width, label='Traditional', color=colors[0], alpha=0.9)

        for idx, (channel, values) in enumerate(channel_data.items()):
            color_idx = min(idx + 1, len(colors) - 1)
            ax.bar(x, values, width, bottom=bottom, label=channel, color=colors[color_idx], alpha=0.9)
            bottom += values

        # Formatting
        ax.set_xlabel('Year', fontsize=12, fontweight='bold')
        ax.set_ylabel('Revenue ($B)', fontsize=12, fontweight='bold')
        ax.set_title('5-Year Revenue Forecast: Traditional + AI Channels', fontsize=14, fontweight='bold')
        ax.set_xticks(x)
        ax.set_xticklabels([str(year) for year in years])
        ax.legend(loc='upper left', framealpha=0.95)
        ax.grid(axis='y', alpha=0.3, linestyle='--')
        ax.set_ylim(0, max(bottom) * 1.1)

        # Add value labels on bars
        for i, year in enumerate(years):
            total = bottom[i]
            ax.text(i, total + 5, f'${total:.0f}B', ha='center', fontweight='bold', fontsize=10)

        plt.tight_layout()
        plt.savefig(self.output_dir / 'revenue_waterfall.png', dpi=300, bbox_inches='tight')
        plt.close()

    def revenue_by_region(self, forecast_by_region: Dict[str, Dict[int, float]], years: np.ndarray):
        """Generate stacked area chart of revenue by region."""
        fig, ax = plt.subplots(figsize=(14, 8))

        regions = list(forecast_by_region.keys())
        colors = [ColorScheme.NAVY, ColorScheme.TEAL, ColorScheme.CORAL, ColorScheme.GOLD]

        # Prepare data
        region_data = {}
        for region in regions:
            region_data[region] = np.array([forecast_by_region[region].get(year, 0) for year in years])

        # Stack area chart
        x = np.arange(len(years))
        ax.stackplot(x, region_data['us_canada'], region_data['europe'],
                     region_data['apac'], region_data['rest_of_world'],
                     labels=regions, colors=colors, alpha=0.8)

        # Formatting
        ax.set_xlabel('Year', fontsize=12, fontweight='bold')
        ax.set_ylabel('Revenue ($B)', fontsize=12, fontweight='bold')
        ax.set_title('Revenue by Region (Stacked Area)', fontsize=14, fontweight='bold')
        ax.set_xticks(x)
        ax.set_xticklabels([str(year) for year in years])
        ax.legend(loc='upper left', framealpha=0.95)
        ax.grid(axis='y', alpha=0.3, linestyle='--')

        plt.tight_layout()
        plt.savefig(self.output_dir / 'revenue_by_region.png', dpi=300, bbox_inches='tight')
        plt.close()

    def monte_carlo_distribution(self, outcomes: np.ndarray, years: np.ndarray, stats: Dict):
        """Generate Monte Carlo distribution histogram with percentile lines."""
        fig, ax = plt.subplots(figsize=(12, 7))

        # Use final year outcomes
        final_outcomes = outcomes[:, -1]

        # Histogram
        counts, bins, patches = ax.hist(final_outcomes, bins=50, color=ColorScheme.ICE_BLUE,
                                        alpha=0.7, edgecolor=ColorScheme.NAVY)

        # Percentile lines
        p10 = stats['p10'][-1]
        p25 = stats['p25'][-1]
        median = stats['median'][-1]
        p75 = stats['p75'][-1]
        p90 = stats['p90'][-1]

        ax.axvline(p10, color=ColorScheme.CORAL, linestyle='--', linewidth=2, label=f'P10: ${p10:.0f}B')
        ax.axvline(p25, color=ColorScheme.GOLD, linestyle='--', linewidth=2, label=f'P25: ${p25:.0f}B')
        ax.axvline(median, color=ColorScheme.NAVY, linestyle='-', linewidth=3, label=f'Median: ${median:.0f}B')
        ax.axvline(p75, color=ColorScheme.GOLD, linestyle='--', linewidth=2, label=f'P75: ${p75:.0f}B')
        ax.axvline(p90, color=ColorScheme.CORAL, linestyle='--', linewidth=2, label=f'P90: ${p90:.0f}B')

        # Formatting
        ax.set_xlabel('Revenue ($B)', fontsize=12, fontweight='bold')
        ax.set_ylabel('Frequency', fontsize=12, fontweight='bold')
        ax.set_title(f'Monte Carlo Distribution - {years[-1]} Revenue ({len(outcomes):,} simulations)',
                     fontsize=14, fontweight='bold')
        ax.legend(loc='upper right', framealpha=0.95, fontsize=10)
        ax.grid(axis='y', alpha=0.3, linestyle='--')

        plt.tight_layout()
        plt.savefig(self.output_dir / 'monte_carlo_distribution.png', dpi=300, bbox_inches='tight')
        plt.close()

    def sensitivity_tornado(self, sensitivity: Dict[str, Tuple[float, float]]):
        """Generate tornado chart for sensitivity analysis."""
        fig, ax = plt.subplots(figsize=(12, 8))

        # Sort by impact range
        params = list(sensitivity.keys())
        low_impacts = [sensitivity[p][0] for p in params]
        high_impacts = [sensitivity[p][1] for p in params]
        impact_range = [abs(h - l) for h, l in zip(high_impacts, low_impacts)]

        sorted_indices = np.argsort(impact_range)[::-1]
        sorted_params = [params[i] for i in sorted_indices]
        sorted_low = [low_impacts[i] for i in sorted_indices]
        sorted_high = [high_impacts[i] for i in sorted_indices]

        # Horizontal bar chart
        y = np.arange(len(sorted_params))
        ax.barh(y, sorted_low, color=ColorScheme.CORAL, alpha=0.8, label='Low Case')
        ax.barh(y, sorted_high, color=ColorScheme.TEAL, alpha=0.8, label='High Case')

        # Formatting
        ax.set_yticks(y)
        ax.set_yticklabels(sorted_params)
        ax.set_xlabel('Revenue Impact (%)', fontsize=12, fontweight='bold')
        ax.set_title('Sensitivity Analysis - Parameter Impact on 5-Year Revenue', fontsize=14, fontweight='bold')
        ax.legend(loc='lower right', framealpha=0.95)
        ax.grid(axis='x', alpha=0.3, linestyle='--')
        ax.axvline(0, color=ColorScheme.NAVY, linewidth=1)

        plt.tight_layout()
        plt.savefig(self.output_dir / 'sensitivity_tornado.png', dpi=300, bbox_inches='tight')
        plt.close()

    def ai_adoption_curves(self, adoption_data: Dict[str, Dict[int, float]], years: np.ndarray):
        """Generate S-curve adoption overlays for all 6 AI channels."""
        fig, ax = plt.subplots(figsize=(14, 8))

        colors = [ColorScheme.NAVY, ColorScheme.TEAL, ColorScheme.CORAL,
                  ColorScheme.GOLD, ColorScheme.ICE_BLUE, ColorScheme.GRAY]

        x = years.astype(float)

        for idx, (channel, adoption_by_year) in enumerate(adoption_data.items()):
            y = np.array([adoption_by_year[year] for year in years]) * 100
            ax.plot(x, y, marker='o', linewidth=3, label=channel, color=colors[idx % len(colors)])

        # Formatting
        ax.set_xlabel('Year', fontsize=12, fontweight='bold')
        ax.set_ylabel('Adoption Rate (%)', fontsize=12, fontweight='bold')
        ax.set_title('AI Channel Adoption S-Curves (Base Case)', fontsize=14, fontweight='bold')
        ax.set_ylim(0, 100)
        ax.legend(loc='center left', framealpha=0.95, fontsize=10)
        ax.grid(True, alpha=0.3, linestyle='--')

        plt.tight_layout()
        plt.savefig(self.output_dir / 'ai_adoption_curves.png', dpi=300, bbox_inches='tight')
        plt.close()

    def market_share_trend(self, share_by_year: Dict[int, float], years: np.ndarray,
                          confidence_band: Tuple[np.ndarray, np.ndarray] = None):
        """Generate market share trend line with optional confidence band."""
        fig, ax = plt.subplots(figsize=(12, 7))

        x = years.astype(float)
        y = np.array([share_by_year[year] * 100 for year in years])

        # Main line
        ax.plot(x, y, marker='o', linewidth=3, markersize=8, color=ColorScheme.NAVY, label='Projected Share')

        # Confidence band if provided
        if confidence_band:
            lower, upper = confidence_band
            ax.fill_between(x, lower * 100, upper * 100, alpha=0.2, color=ColorScheme.ICE_BLUE,
                            label='Confidence Band')

        # Formatting
        ax.set_xlabel('Year', fontsize=12, fontweight='bold')
        ax.set_ylabel('Market Share (%)', fontsize=12, fontweight='bold')
        ax.set_title('Projected Market Share Trend', fontsize=14, fontweight='bold')
        ax.legend(loc='best', framealpha=0.95)
        ax.grid(True, alpha=0.3, linestyle='--')
        ax.set_ylim(15, 30)

        # Add value labels
        for xi, yi in zip(x, y):
            ax.text(xi, yi + 0.3, f'{yi:.1f}%', ha='center', fontsize=9)

        plt.tight_layout()
        plt.savefig(self.output_dir / 'market_share_trend.png', dpi=300, bbox_inches='tight')
        plt.close()

    def privacy_multiplier_by_region(self, privacy_multipliers: Dict[str, Dict[int, float]], years: np.ndarray):
        """Generate line chart of privacy multiplier by region over time."""
        fig, ax = plt.subplots(figsize=(12, 7))

        regions = list(privacy_multipliers.keys())
        colors = [ColorScheme.NAVY, ColorScheme.TEAL, ColorScheme.CORAL, ColorScheme.GOLD]

        x = years.astype(float)

        for idx, region in enumerate(regions):
            y = np.array([privacy_multipliers[region][year] for year in years])
            ax.plot(x, y, marker='o', linewidth=2.5, label=region, color=colors[idx])

        # Formatting
        ax.set_xlabel('Year', fontsize=12, fontweight='bold')
        ax.set_ylabel('Revenue Multiplier', fontsize=12, fontweight='bold')
        ax.set_title('Privacy Impact on Revenue by Region', fontsize=14, fontweight='bold')
        ax.legend(loc='best', framealpha=0.95)
        ax.grid(True, alpha=0.3, linestyle='--')
        ax.axhline(1.0, color=ColorScheme.GRAY, linestyle='--', alpha=0.5, linewidth=1)

        plt.tight_layout()
        plt.savefig(self.output_dir / 'privacy_multiplier_by_region.png', dpi=300, bbox_inches='tight')
        plt.close()

    def top_down_bottom_up_reconciliation(self, top_down: Dict[int, float],
                                         bottom_up: Dict[int, float], years: np.ndarray):
        """Generate dual-line chart comparing top-down and bottom-up forecasts."""
        fig, ax = plt.subplots(figsize=(12, 7))

        x = years.astype(float)
        y_top = np.array([top_down[year] for year in years])
        y_bottom = np.array([bottom_up[year] for year in years])

        ax.plot(x, y_top, marker='s', linewidth=3, markersize=8, label='Top-Down (TAM × Share)',
                color=ColorScheme.TEAL)
        ax.plot(x, y_bottom, marker='o', linewidth=3, markersize=8, label='Bottom-Up (Channel Model)',
                color=ColorScheme.CORAL)

        # Formatting
        ax.set_xlabel('Year', fontsize=12, fontweight='bold')
        ax.set_ylabel('Revenue ($B)', fontsize=12, fontweight='bold')
        ax.set_title('Top-Down vs Bottom-Up Revenue Reconciliation', fontsize=14, fontweight='bold')
        ax.legend(loc='upper left', framealpha=0.95, fontsize=11)
        ax.grid(True, alpha=0.3, linestyle='--')

        # Gap annotation
        for xi, y_t, y_b in zip(x, y_top, y_bottom):
            gap = y_b - y_t
            color = ColorScheme.GOLD if gap > 0 else ColorScheme.CORAL
            ax.annotate(f'{gap:.0f}B', xy=(xi, (y_t + y_b) / 2), fontsize=8, color=color)

        plt.tight_layout()
        plt.savefig(self.output_dir / 'reconciliation.png', dpi=300, bbox_inches='tight')
        plt.close()
