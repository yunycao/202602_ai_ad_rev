"""
Data Loader Module
Loads configuration and provides historical revenue data with derived metrics.
"""

import json
import pandas as pd
import numpy as np
from pathlib import Path


class DataLoader:
    """Load and process configuration and historical revenue data."""

    def __init__(self, config_path):
        """Initialize with config file path."""
        with open(config_path, 'r') as f:
            self.config = json.load(f)

        self.base_year = self.config['meta']['base_year']
        self.forecast_end_year = self.config['meta']['forecast_end_year']
        self.forecast_horizon = self.config['meta']['forecast_horizon']

    def get_historical_revenue_df(self):
        """Return historical annual revenue as DataFrame with derived metrics."""
        annual = self.config['historical_revenue']['annual']

        df = pd.DataFrame({
            'year': list(annual.keys()),
            'revenue': list(annual.values())
        }).astype({'year': int, 'revenue': float})

        df = df.sort_values('year').reset_index(drop=True)

        # Compute YoY growth
        df['yoy_growth'] = df['revenue'].pct_change()

        return df

    def get_quarterly_revenue_df(self):
        """Return quarterly revenue data as DataFrame."""
        quarterly = self.config['historical_revenue']['quarterly']

        data = []
        for period, revenue in quarterly.items():
            parts = period.split('_')
            year = int(parts[0])
            quarter = int(parts[1][1])
            data.append({'year': year, 'quarter': quarter, 'revenue': revenue})

        df = pd.DataFrame(data).sort_values(['year', 'quarter']).reset_index(drop=True)

        return df

    def get_regional_breakdown(self):
        """Return regional revenue split and ARPU data."""
        regional_split = self.config['historical_revenue']['regional_split']
        arpu = self.config['historical_revenue']['arpu_by_region']

        split_df = pd.DataFrame({
            'region': list(regional_split.keys()),
            'revenue_share': list(regional_split.values())
        })

        # Convert ARPU data to DataFrame
        arpu_records = []
        for region, years_dict in arpu.items():
            for year, arpu_val in years_dict.items():
                arpu_records.append({
                    'region': region,
                    'year': int(year),
                    'arpu': arpu_val
                })

        arpu_df = pd.DataFrame(arpu_records)

        return split_df, arpu_df

    def get_ai_channels_config(self):
        """Return AI channels configuration."""
        channels = self.config['ai_channels']

        records = []
        for channel_key, channel_data in channels.items():
            record = {
                'channel_id': channel_key,
                'label': channel_data['label'],
                'adoption_start_year': channel_data['adoption_start_year'],
                'adoption_inflection_year': channel_data['adoption_inflection_year'],
                'adoption_ceiling_pct': channel_data['adoption_ceiling_pct'],
            }
            records.append(record)

        return pd.DataFrame(records), channels

    def get_cannibalization_matrix(self):
        """Return cannibalization matrix as nested dict."""
        return self.config['cannibalization_matrix']

    def get_market_config(self):
        """Return market configuration."""
        return self.config['market']

    def get_privacy_config(self):
        """Return privacy configuration."""
        return self.config['privacy']

    def get_integrity_config(self):
        """Return integrity configuration."""
        return self.config['integrity']

    def get_scenarios_config(self):
        """Return scenario definitions."""
        return self.config['scenarios']

    def get_monte_carlo_config(self):
        """Return Monte Carlo configuration."""
        return self.config['monte_carlo']

    def get_seasonality_config(self):
        """Return seasonality factors."""
        return self.config['seasonality']
