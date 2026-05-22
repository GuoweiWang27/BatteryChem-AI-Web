#!/usr/bin/env python3
"""Generate real prediction JSON by running the actual XGBoost model over all UI combinations."""
import json, sys, os, math

sys.path.insert(0, '/Users/YouMing/Desktop/BatteryChem-AI-Web')

from app import (
    REAL_ADDITIVES_DATABASE, REAL_SALTS_DATABASE,
    build_pure_uncoupled_15d_features
)
from data_pipeline import REAL_SOLVENTS_DATABASE
import joblib
import numpy as np

# Load model
brains = joblib.load('/Users/YouMing/Desktop/BatteryChem-AI-Web/ultimate_academic_brain.pkl')
model = brains['cond_brain']

SALTS = ['LiPF6', 'LiFSI', 'LiTFSI']

# Solvent map: UI key → DB key → display name
SOLVENT_ENTRIES = [
    ('ec_dmc', 'EC', 'EC:DMC 1:1'),
    ('ec_dec', 'EC', 'EC:DEC 1:1'),
    ('ec_emc', 'EC', 'EC:EMC 3:7'),
    ('dol_dme', 'DOL', 'DOL:DME 1:1'),
    # Individual solvents for diversity
    ('dmc', 'DMC', 'DMC (pure)'),
    ('dec', 'DEC', 'DEC (pure)'),
    ('emc', 'EMC', 'EMC (pure)'),
    ('pc', 'PC', 'PC (pure)'),
    ('dol', 'DOL', 'DOL (pure)'),
    ('dme', 'DME', 'DME (pure)'),
]

ADDITIVE_MAP = {
    'fec': 'FEC', 'vc': 'VC', 'ps': 'PS', 'sn': 'SN',
    'adn': 'ADN', 'dtd': 'DTD',
}

POLYPHENOL_MAP = {
    'quercetin': 'Quercetin', 'catechin': 'Catechin',
    'gallic_acid': 'Gallic_Acid', 'resveratrol': 'Resveratrol',
}

ADDITIVE_DISPLAY = {
    'fec': 'FEC', 'vc': 'VC', 'ps': 'PS', 'sn': 'SN', 'adn': 'ADN', 'dtd': 'DTD',
    'quercetin': 'Quercetin', 'catechin': 'Catechin', 'gallic_acid': 'Gallic Acid', 'resveratrol': 'Resveratrol'
}

CONCENTRATIONS = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0]

all_additives = {**ADDITIVE_MAP, **POLYPHENOL_MAP}
results = []
radar_templates = []

for salt_name in SALTS:
    salt_meta = REAL_SALTS_DATABASE[salt_name]
    for solvent_key, solvent_db_key, solvent_display in SOLVENT_ENTRIES:
        if solvent_db_key not in REAL_SOLVENTS_DATABASE:
            continue
        s_desc = REAL_SOLVENTS_DATABASE[solvent_db_key]
        for add_key, add_db_key in all_additives.items():
            if add_db_key not in REAL_ADDITIVES_DATABASE:
                continue
            a_desc = REAL_ADDITIVES_DATABASE[add_db_key]
            for conc in CONCENTRATIONS:
                try:
                    X = np.array([build_pure_uncoupled_15d_features(
                        s_desc["mw"], s_desc["tpsa"], s_desc["logp"], s_desc["homo"], s_desc["lumo"],
                        salt_meta["mw"], salt_meta["tpsa"], conc,
                        a_desc["mw"], a_desc["tpsa"], a_desc["logp"], a_desc["homo"], a_desc["lumo"]
                    )])
                    cond = float(model.predict(X)[0])

                    stability = round(float(4.5 - 0.3 * abs(a_desc["lumo"] - s_desc["homo"]) + 0.1 * conc), 2)
                    confidence = min(0.95, 0.55 + 0.04 * cond)

                    is_polyphenol = add_key in POLYPHENOL_MAP
                    sei_type = 'Polyphenol-SEI' if is_polyphenol else ('LiF-rich' if a_desc['lumo'] < 0 else 'Organic-rich')

                    if is_polyphenol:
                        quality = 'B'
                    elif salt_name == 'LiFSI' and add_key in ('fec', 'vc'):
                        quality = 'A'
                    elif salt_name == 'LiTFSI' and add_key in ('fec', 'vc', 'ps'):
                        quality = 'A'
                    elif add_key in ('fec', 'vc', 'ps'):
                        quality = 'B'
                    else:
                        quality = 'B' if cond > 5 else 'C'

                    # Radar metrics
                    radar = {
                        "conductivity_normalized": round(float(np.clip(cond / 16.0, 0.1, 1.0)), 2),
                        "viscosity_resistance": round(float(np.clip((s_desc["mw"]/100.0)*(1.0+0.05*conc)*(salt_meta["mw"]/150.0)/2.0, 0.1, 1.0)), 2),
                        "dosage_level": round(float(np.clip(conc / 5.0, 0.1, 1.0)), 2),
                        "stability_field": round(float(np.clip((5.5 - abs(a_desc["lumo"]-s_desc["homo"])) / 5.5, 0.1, 1.0)), 2),
                        "polarity_matching": round(float(np.clip((150.0 - abs(a_desc["tpsa"]-s_desc["tpsa"])) / 150.0, 0.1, 1.0)), 2)
                    }

                    results.append({
                        "salt": salt_name,
                        "solvent_ui": solvent_key,
                        "solvent_display": solvent_display,
                        "additive_ui": add_key,
                        "additive_display": ADDITIVE_DISPLAY.get(add_key, add_key),
                        "mode": "traditional" if add_key in ADDITIVE_MAP else "polyphenol",
                        "conc": conc,
                        "conductivity": round(cond, 2),
                        "confidence": round(confidence, 2),
                        "stability": stability,
                        "sei_type": sei_type,
                        "quality": quality,
                        "radar": radar,
                    })

                    # Radar template: one per unique (solvent_display, salt, additive)
                    template_key = (solvent_display, salt_name, add_key)
                    if not any(t.get('key') == template_key for t in radar_templates):
                        radar_templates.append({
                            "key": list(template_key),
                            "solvent_display": solvent_display,
                            "salt": salt_name,
                            "additive_ui": add_key,
                            "additive_display": ADDITIVE_DISPLAY.get(add_key, add_key),
                            "typical_conc": 2.5,
                            "radar": radar,
                        })

                except Exception as e:
                    print(f"ERROR: {salt_name} {solvent_key} {add_key} {conc}: {e}")

# Sort and rank
results.sort(key=lambda r: r['conductivity'], reverse=True)
for i, r in enumerate(results):
    r['rank'] = i + 1

# Write top100 predictions
out1 = '/Users/YouMing/Desktop/BatteryChem-AI-Web-v3/data/top100_predictions.json'
with open(out1, 'w') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

# Write radar templates
out2 = '/Users/YouMing/Desktop/BatteryChem-AI-Web-v3/data/radar_templates.json'
with open(out2, 'w') as f:
    json.dump(radar_templates, f, indent=2, ensure_ascii=False)

print(f"Predictions: {len(results)} records → {out1}")
print(f"Radar templates: {len(radar_templates)} templates → {out2}")
print(f"Conductivity range: {min(r['conductivity'] for r in results):.2f} – {max(r['conductivity'] for r in results):.2f}")
print(f"\nTop 5:")
for r in results[:5]:
    print(f"  #{r['rank']} {r['solvent_display']} + {r['salt']} + {r['conc']}% {r['additive_display']}: σ={r['conductivity']} mS/cm")
