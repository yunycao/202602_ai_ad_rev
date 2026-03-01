"""
Market Model
TAM projection, market share dynamics, and top-down vs bottom-up reconciliation.
"""

import numpy as np
import pandas as pd
from typing import Dict, Tuple


class MarketModel:
    """Model for market TAM and share dynamics."""

    def __init__(self, data_loader):
        """Initialize market model."""
        self.data_loader = data_loader
        self.config = data_loader.config
        self.base_year = data_loader.base_year
        self.forecast_end_year = data_loader.forecast_end_year
        self.years = np.arange(data_loader.base_year, data_loader.forecast_end_year + 1)

        self.market_config = data_loader.get_market_config()

    def project_tam(self) -> Dict[int, float]:
        """
        Project total digital ad market (TAM) from $740B (2024) forward.

        Returns:
            dict of {year: tam_in_billions}
        """
        tam_2024 = self.market_config['total_digital_ad_spend_2024_billions']
        format_mix = self.market_config['format_mix']
        format_growth = self.market_config['format_growth_rates']

        tam = {}

        for year in self.years:
            if year == self.base_year:
                tam[year] = tam_2024
            else:
                # Weighted average growth rate
                growth_rate = sum(
                    format_mix[fmt] * format_growth[fmt]
                    for fmt in format_mix.keys()
                )
                years_forward = year - self.base_year
                tam[year] = tam_2024 * (1.0 + growth_rate) ** years_forward

        return tam

    def project_market_share(self) -> Tuple[Dict[int, float], Dict]:
        """
        Project company market share using tailwinds and headwinds.

        Returns:
            tuple of (share_by_year dict, diagnostics dict)
        """
        base_share = self.market_config['company_share_2024']
        tailwinds = self.market_config['share_tailwinds']
        headwinds = self.market_config['share_headwinds']

        # Compute competitive moat score (0-10 scale)
        moat_scores = self.market_config['competitive_moat_scores']
        avg_moat = np.mean(list(moat_scores.values()))
        # Moat defensibility: higher moat = better share defense
        moat_multiplier = 0.95 + (avg_moat / 10.0) * 0.15  # Range 0.95 to 1.10

        # Compute net annual share movement
        net_annual_movement = sum(tailwinds.values()) + sum(headwinds.values())

        share = {}
        diagnostics = {
            'base_share': base_share,
            'total_tailwinds': sum(tailwinds.values()),
            'total_headwinds': sum(headwinds.values()),
            'net_annual_movement': net_annual_movement,
            'moat_multiplier': moat_multiplier,
        }

        for year in self.years:
            if year == self.base_year:
                share[year] = base_share
            else:
                years_forward = year - self.base_year
                # Share moves by net movement, modulated by moat
                annual_movement = net_annual_movement * moat_multiplier
                share[year] = base_share + (annual_movement * years_forward)
                # Cap share between 15% and 35%
                share[year] = np.clip(share[year], 0.15, 0.35)

        return share, diagnostics

    def reconcile_top_down_bottom_up(self, tam: Dict[int, float],
                                    company_share: Dict[int, float],
                                    bottom_up_forecast: Dict[int, float]) -> Dict:
        """
        Compare TAM×share (top-down) with channel-level (bottom-up) projections.

        Args:
            tam: TAM by year
            company_share: market share by year
            bottom_up_forecast: total revenue from bottom-up model

        Returns:
            dict with reconciliation analysis
        """
        reconciliation = {}

        for year in self.years:
            top_down = tam[year] * company_share[year]
            bottom_up = bottom_up_forecast[year]
            gap = bottom_up - top_down
            gap_pct = gap / top_down if top_down > 0 else 0

            reconciliation[year] = {
                'tam': tam[year],
                'company_share': company_share[year],
                'top_down_revenue': top_down,
                'bottom_up_revenue': bottom_up,
                'gap': gap,
                'gap_pct': gap_pct,
                'diagnostic': self._diagnose_gap(gap_pct, year)
            }

        return reconciliation

    def _diagnose_gap(self, gap_pct: float, year: int) -> str:
        """Provide diagnostic message for gap between top-down and bottom-up."""
        if abs(gap_pct) < 0.05:
            return "Good alignment between models"
        elif gap_pct > 0.05:
            return f"Bottom-up {gap_pct*100:.1f}% above top-down - may underestimate AI revenue growth"
        else:
            return f"Bottom-up {abs(gap_pct)*100:.1f}% below top-down - conservative on market share gains"

    def get_tam_ai_expansion_impact(self) -> float:
        """
        Return TAM expansion multiplier from AI creating new ad formats and opportunities.

        Returns:
            multiplier (>1.0 means TAM grows beyond baseline)
        """
        return self.market_config.get('tam_ai_expansion_multiplier', 1.0)
