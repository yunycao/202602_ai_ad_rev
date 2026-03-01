"""
Privacy Model
Signal degradation, signal recovery, privacy-adjusted revenue multiplier, and compliance costs.
"""

import numpy as np
import pandas as pd
from typing import Dict, Tuple


class PrivacyModel:
    """Model for privacy impacts on revenue and compliance costs."""

    def __init__(self, data_loader):
        """Initialize privacy model."""
        self.data_loader = data_loader
        self.config = data_loader.config
        self.base_year = data_loader.base_year
        self.forecast_end_year = data_loader.forecast_end_year
        self.years = np.arange(data_loader.base_year, data_loader.forecast_end_year + 1)

        self.privacy_config = data_loader.get_privacy_config()

        # Regional split for privacy impacts
        self.regions = ['us_canada', 'europe', 'apac', 'rest_of_world']
        regional_split = data_loader.get_historical_revenue_df()
        self.regional_revenue_split = data_loader.config['historical_revenue']['regional_split']

    def compute_signal_loss_by_year(self, region: str) -> Dict[int, float]:
        """
        Compute cumulative signal loss from OS restrictions, regulatory consent, cookie deprecation, etc.

        Args:
            region: region identifier

        Returns:
            dict of {year: signal_loss_fraction (0-1)} representing % of signals lost
        """
        signal_deg = self.privacy_config['signal_degradation']
        signal_loss = {}

        for year in self.years:
            loss = 0.0

            # OS tracking restrictions (depends on region)
            os_tracking = signal_deg['os_tracking_restrictions']
            if region == 'us_canada':
                opt_in = os_tracking['opt_in_rate_us']
            elif region == 'europe':
                opt_in = os_tracking['opt_in_rate_eu']
            else:  # apac, rest_of_world
                opt_in = os_tracking['opt_in_rate_apac']

            os_loss = os_tracking['severity'] * (1.0 - opt_in)
            loss += os_loss

            # Regulatory consent decay (annual accumulation in affected regions)
            if region in ['europe', 'us_canada']:
                years_forward = year - self.base_year
                consent_decay = signal_deg['regulatory_consent_decay']
                annual_decay = consent_decay['annual_rate']
                loss += annual_decay * years_forward * 0.5  # 50% of potential loss

            # Cookie deprecation (phase-in through 2027)
            cookie_config = signal_deg['cookie_deprecation']
            if year <= cookie_config['timeline_completion_year']:
                years_to_completion = cookie_config['timeline_completion_year'] - self.base_year
                progress = (year - self.base_year) / max(1, years_to_completion)
                loss += cookie_config['signal_loss'] * progress
            else:
                loss += cookie_config['signal_loss']

            # User privacy adoption (adblocker, VPN growth)
            user_privacy = signal_deg['user_privacy_adoption']
            years_forward = year - self.base_year
            loss += user_privacy['adblocker_growth'] * years_forward * 0.3
            loss += user_privacy['vpn_growth'] * years_forward * 0.1

            signal_loss[year] = min(loss, 0.60)  # Cap at 60% loss

        return signal_loss

    def compute_signal_recovery_by_year(self) -> Dict[int, float]:
        """
        Compute AI-driven signal recovery from on-device inference, probabilistic modeling, PETs, etc.

        Returns:
            dict of {year: signal_recovery_fraction (0-1)} representing % of signals recovered
        """
        signal_recovery = self.privacy_config['signal_recovery_ai']
        recovery_by_year = {}

        for year in self.years:
            recovery = 0.0

            # On-device inference
            on_device = signal_recovery['on_device_inference']
            if year >= on_device['timeline_start']:
                years_active = year - on_device['timeline_start'] + 1
                recovery += on_device['recovery_pct'] * min(years_active / 3.0, 1.0)  # Ramp over 3 years

            # Probabilistic modeling
            prob_model = signal_recovery['probabilistic_modeling']
            if year >= prob_model['timeline_start']:
                recovery += prob_model['accuracy_vs_deterministic'] * 0.25  # 25% recovery potential

            # Privacy enhancing tech
            pet = signal_recovery['privacy_enhancing_tech']
            if year >= pet['timeline_start']:
                years_active = year - pet['timeline_start'] + 1
                recovery += pet['recovery_pct'] * min(years_active / 2.0, 1.0)

            # First-party enrichment
            first_party = signal_recovery['first_party_enrichment']
            if year >= first_party['timeline_start']:
                recovery += first_party['amplification_multiplier'] * 0.15 - 0.15  # Net boost

            recovery_by_year[year] = min(recovery, 0.45)  # Cap recovery at 45%

        return recovery_by_year

    def compute_privacy_adjusted_multiplier(self, region: str) -> Dict[int, float]:
        """
        Compute revenue multiplier per region per year.
        multiplier = base × (1 - loss) × (1 + recovery)

        Args:
            region: region identifier

        Returns:
            dict of {year: multiplier (0-1)} to apply to revenue
        """
        signal_loss = self.compute_signal_loss_by_year(region)
        signal_recovery = self.compute_signal_recovery_by_year()

        multiplier = {}
        for year in self.years:
            loss = signal_loss[year]
            recovery = signal_recovery[year]
            # Multiplier = (1 - net_loss)
            net_loss = loss * (1.0 - recovery)
            multiplier[year] = 1.0 - net_loss

        return multiplier

    def compute_privacy_multipliers_all_regions(self) -> Dict[str, Dict[int, float]]:
        """
        Compute privacy multipliers for all regions.

        Returns:
            dict of {region: {year: multiplier}}
        """
        multipliers = {}
        for region in self.regions:
            multipliers[region] = self.compute_privacy_adjusted_multiplier(region)

        return multipliers

    def compute_compliance_costs(self, total_revenue: Dict[int, float]) -> Dict[int, float]:
        """
        Calculate privacy compliance costs as % of revenue.

        Args:
            total_revenue: dict of {year: total_revenue}

        Returns:
            dict of {year: compliance_cost}
        """
        compliance_pct = self.privacy_config['compliance_cost_pct_of_revenue']

        costs = {}
        for year, revenue in total_revenue.items():
            costs[year] = revenue * compliance_pct

        return costs
