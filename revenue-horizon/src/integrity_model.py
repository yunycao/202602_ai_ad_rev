"""
Integrity Model
Content quality scoring, integrity investment ROI, CPM impact, and brand safety.
"""

import numpy as np
import pandas as pd
from typing import Dict


class IntegrityModel:
    """Model for content integrity and brand safety impacts on revenue."""

    def __init__(self, data_loader):
        """Initialize integrity model."""
        self.data_loader = data_loader
        self.config = data_loader.config
        self.base_year = data_loader.base_year
        self.forecast_end_year = data_loader.forecast_end_year
        self.years = np.arange(data_loader.base_year, data_loader.forecast_end_year + 1)

        self.integrity_config = data_loader.get_integrity_config()

    def compute_content_quality_score(self) -> Dict[int, float]:
        """
        Compute integrity health score (0-100) based on AI misinformation rate, deepfake incidents, spam.

        Returns:
            dict of {year: integrity_score (0-100)}
        """
        content_risks = self.integrity_config['content_risks']
        ad_integrity = self.integrity_config['ad_integrity_risks']

        scores = {}

        for year in self.years:
            years_forward = year - self.base_year

            # Baseline score
            base_score = 85.0

            # AI misinformation rate impact
            misinformation = content_risks['ai_misinformation_rate']
            misinformation_rate = misinformation['base'] * (1.0 + misinformation['annual_growth']) ** years_forward
            # Rate of 5% = 5 point deduction, scales up
            score_impact = -min(misinformation_rate * 100, 15)
            base_score += score_impact

            # Deepfake incident impact
            deepfake = content_risks['deepfake_incident_rate']
            deepfake_incidents = deepfake['base'] * (1.0 + 0.20) ** years_forward  # Growing 20% annually
            deepfake_impact = -min(deepfake_incidents * 15, 8)  # Up to 8 point deduction
            base_score += deepfake_impact

            # AI spam metric inflation impact
            spam = content_risks['ai_spam_metric_inflation']
            spam_rate = spam['base'] * (1.0 + spam['annual_growth']) ** years_forward
            spam_impact = -min(spam_rate * 50, 10)
            base_score += spam_impact

            # Fraudulent ad growth impact
            fraud_growth = ad_integrity['fraudulent_ad_growth']
            fraud_rate = 0.01 * (1.0 + fraud_growth) ** years_forward
            fraud_impact = -min(fraud_rate * 100, 5)
            base_score += fraud_impact

            # Brand safety incidents impact
            brand_safety_freq = ad_integrity['brand_safety_incident_frequency']
            incidents = brand_safety_freq * (years_forward + 1)
            brand_safety_impact = -min(incidents * 2, 7)
            base_score += brand_safety_impact

            # Measurement fraud impact
            measurement_fraud = ad_integrity['measurement_fraud_rate']
            measurement_impact = -min(measurement_fraud * 20, 4)
            base_score += measurement_impact

            scores[year] = np.clip(base_score, 20, 100)

        return scores

    def compute_integrity_investment_impact(self, content_scores: Dict[int, float]) -> Dict[int, float]:
        """
        Model how integrity spend improves the content quality score.

        Args:
            content_scores: dict of baseline integrity scores by year

        Returns:
            dict of {year: improved_integrity_score}
        """
        investment_pct = self.integrity_config['integrity_investment_pct_of_revenue']
        sensitivity = self.integrity_config['integrity_score_sensitivity_to_investment']
        lag_quarters = self.integrity_config['investment_to_score_lag_quarters']
        lag_years = lag_quarters / 4.0

        improved_scores = {}

        for year in self.years:
            base_score = content_scores[year]

            # Investment in this year affects score after lag
            # Maximum score improvement: sensitivity * investment_pct * 100
            max_improvement = sensitivity * investment_pct * 100
            # Ramp improvement: reaches full effect after 2 years
            years_since_investment = max(0, year - self.base_year - lag_years)
            improvement_fraction = min(years_since_investment / 2.0, 1.0)
            improvement = max_improvement * improvement_fraction

            improved_scores[year] = np.clip(base_score + improvement, 20, 100)

        return improved_scores

    def compute_cpm_multiplier(self, integrity_scores: Dict[int, float]) -> Dict[int, float]:
        """
        Compute CPM multiplier based on integrity score.
        Higher integrity = higher CPM (advertisers pay more for safe placements).

        Args:
            integrity_scores: dict of integrity scores by year

        Returns:
            dict of {year: cpm_multiplier (0.85-1.15)}
        """
        sensitivity = self.integrity_config['cpm_sensitivity_to_integrity_score']

        multipliers = {}

        for year, score in integrity_scores.items():
            # Baseline CPM at score 80
            baseline_score = 80
            score_delta = (score - baseline_score) / baseline_score

            # Multiplier = 1 + (sensitivity * score_delta)
            # sensitivity = 0.15 means 10-point score change = 1.5% CPM change
            multiplier = 1.0 + (sensitivity * score_delta)
            multipliers[year] = np.clip(multiplier, 0.85, 1.15)

        return multipliers

    def compute_brand_safety_impact(self, deepfake_incidents: float) -> Dict[int, float]:
        """
        Model advertiser spend pullback from brand safety incidents.

        Returns:
            dict of {year: revenue_multiplier}
        """
        deepfake_config = self.integrity_config['content_risks']['deepfake_incident_rate']
        elasticity = deepfake_config['advertiser_pullback_elasticity']

        multipliers = {}

        for year in self.years:
            years_forward = year - self.base_year
            # Incidents grow over time
            incident_rate = deepfake_config['base'] * (1.0 + 0.20) ** years_forward
            # Advertiser pullback: elasticity * incident_rate
            pullback = elasticity * incident_rate
            multiplier = 1.0 - pullback

            multipliers[year] = np.clip(multiplier, 0.80, 1.0)

        return multipliers
