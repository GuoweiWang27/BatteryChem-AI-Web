const SHAP_WATERFALL_DATA = [
  {
    "id": "example_1",
    "formula": "EC:DMC 1:1 + LiFSI + 3.5% FEC",
    "base_value": 9.8,
    "final_value": 14.2,
    "contributions": [
      {
        "feature": "Additive LUMO",
        "value": 1.8,
        "direction": "positive"
      },
      {
        "feature": "Solvent TPSA",
        "value": 1.1,
        "direction": "positive"
      },
      {
        "feature": "Salt MW",
        "value": 0.7,
        "direction": "positive"
      },
      {
        "feature": "Dosage Level",
        "value": 0.5,
        "direction": "positive"
      },
      {
        "feature": "Additive TPSA",
        "value": 0.3,
        "direction": "positive"
      },
      {
        "feature": "Quantum Cross Gap",
        "value": -0.3,
        "direction": "negative"
      },
      {
        "feature": "Solvent LogP",
        "value": -0.5,
        "direction": "negative"
      },
      {
        "feature": "Solvent HOMO",
        "value": -0.2,
        "direction": "negative"
      }
    ]
  },
  {
    "id": "example_2",
    "formula": "EC:DEC 1:1 + LiPF₆ + 2.0% VC",
    "base_value": 9.8,
    "final_value": 11.6,
    "contributions": [
      {
        "feature": "Solvent TPSA",
        "value": 0.9,
        "direction": "positive"
      },
      {
        "feature": "Additive LUMO",
        "value": 0.6,
        "direction": "positive"
      },
      {
        "feature": "Salt MW",
        "value": 0.4,
        "direction": "positive"
      },
      {
        "feature": "Dosage Level",
        "value": 0.2,
        "direction": "positive"
      },
      {
        "feature": "Additive TPSA",
        "value": -0.2,
        "direction": "negative"
      },
      {
        "feature": "Quantum Cross Gap",
        "value": -0.4,
        "direction": "negative"
      },
      {
        "feature": "Solvent LogP",
        "value": -0.3,
        "direction": "negative"
      },
      {
        "feature": "Solvent HOMO",
        "value": -0.4,
        "direction": "negative"
      }
    ]
  },
  {
    "id": "example_3",
    "formula": "DOL:DME 1:1 + LiTFSI + 4.0% SN",
    "base_value": 9.8,
    "final_value": 10.1,
    "contributions": [
      {
        "feature": "Solvent TPSA",
        "value": 0.5,
        "direction": "positive"
      },
      {
        "feature": "Dosage Level",
        "value": 0.4,
        "direction": "positive"
      },
      {
        "feature": "Additive LUMO",
        "value": 0.2,
        "direction": "positive"
      },
      {
        "feature": "Salt MW",
        "value": -0.1,
        "direction": "negative"
      },
      {
        "feature": "Additive TPSA",
        "value": -0.3,
        "direction": "negative"
      },
      {
        "feature": "Quantum Cross Gap",
        "value": -0.5,
        "direction": "negative"
      },
      {
        "feature": "Solvent LogP",
        "value": -0.2,
        "direction": "negative"
      },
      {
        "feature": "Solvent HOMO",
        "value": -0.3,
        "direction": "negative"
      }
    ]
  }
];