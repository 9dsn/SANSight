import zipfile
from pathlib import Path

import numpy as np
import pandas as pd

PROJECT_DIR = Path(__file__).resolve().parent.parent
RANDOM_FOREST_DIR = PROJECT_DIR / "RandomForestData"
ZIP_FILE = RANDOM_FOREST_DIR / "04032026-23-45.zip"
EXTRACTED_DIR = RANDOM_FOREST_DIR / "extracted"
OUTPUT_FILE = RANDOM_FOREST_DIR / "cleaned_nutrition.csv"

TARGET_NUTRIENTS = ["Sodium", "Vitamin D", "Magnesium", "Calcium"]
REFERENCE_COLS = ["Subject", "Date"]


def unzip_data():
    """Unzip the ZIP file into extracted/ directory."""
    if not ZIP_FILE.exists():
        raise FileNotFoundError(f"ZIP file not found: {ZIP_FILE}")

    EXTRACTED_DIR.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(ZIP_FILE, "r") as zf:
        zf.extractall(EXTRACTED_DIR)


def find_target_csv():
    """Find MR016G_Campaign_1_Dietary_Intake_Totals_All.csv in extracted folders."""
    target_name = "MR016G_Campaign_1_Dietary_Intake_Totals_All.csv"
    for path in EXTRACTED_DIR.rglob("*.csv"):
        if path.name == target_name:
            return path

    raise FileNotFoundError(
        f"Could not find {target_name} in {EXTRACTED_DIR}. "
        f"Available CSVs: {list(EXTRACTED_DIR.rglob('*.csv'))}"
    )


def find_column_by_pattern(df: pd.DataFrame, pattern: str) -> str:
    """Find column name by case-insensitive partial matching."""
    pattern_lower = pattern.lower()
    for col in df.columns:
        if pattern_lower in col.lower():
            return col
    raise ValueError(f"No column found matching '{pattern}' in dataset")


def load_and_extract_columns(csv_path: Path):
    """Load CSV and extract target columns with reference columns."""
    df = pd.read_csv(csv_path)

    print(f"Loaded CSV with {len(df)} rows and {len(df.columns)} columns")
    print(f"Columns available: {list(df.columns)[:10]}...")

    nutrient_cols = {}
    for nutrient in TARGET_NUTRIENTS:
        col = find_column_by_pattern(df, nutrient)
        nutrient_cols[nutrient] = col
        print(f"  {nutrient} -> {col}")

    ref_cols_found = []
    for ref in REFERENCE_COLS:
        try:
            col = find_column_by_pattern(df, ref)
            ref_cols_found.append(col)
            print(f"  {ref} -> {col}")
        except ValueError:
            print(f"  {ref} -> not found (skipping)")

    cols_to_keep = ref_cols_found + list(nutrient_cols.values())
    df_subset = df[cols_to_keep].copy()

    return df_subset, nutrient_cols


def clean_data(df: pd.DataFrame, nutrient_cols: dict):
    """Clean the nutritional data."""
    nutrient_col_names = list(nutrient_cols.values())

    print("\n=== Before Cleaning ===")
    print(f"Total rows: {len(df)}")
    print("Missing values per column:")
    for col in df.columns:
        missing = df[col].isna().sum()
        print(f"  {col}: {missing}")

    initial_rows = len(df)

    # Drop rows where ALL nutrient columns are missing
    mask_all_missing = df[nutrient_col_names].isna().all(axis=1)
    df = df[~mask_all_missing].copy()
    dropped_all_missing = initial_rows - len(df)

    # Fill remaining missing values with column median
    for col in nutrient_col_names:
        median = df[col].median()
        df[col].fillna(median, inplace=True)

    # Remove duplicate rows
    initial_after_drop = len(df)
    df = df.drop_duplicates().reset_index(drop=True)
    dropped_duplicates = initial_after_drop - len(df)

    print("\n=== After Cleaning ===")
    print(f"Total rows: {len(df)}")
    print(f"Rows dropped (all nutrients missing): {dropped_all_missing}")
    print(f"Rows dropped (duplicates): {dropped_duplicates}")
    print("Missing values per column:")
    for col in df.columns:
        missing = df[col].isna().sum()
        print(f"  {col}: {missing}")

    return df


def main():
    unzip_data()
    csv_path = find_target_csv()
    print(f"Found target CSV: {csv_path}\n")

    df, nutrient_cols = load_and_extract_columns(csv_path)
    df_clean = clean_data(df, nutrient_cols)

    RANDOM_FOREST_DIR.mkdir(parents=True, exist_ok=True)
    df_clean.to_csv(OUTPUT_FILE, index=False)
    print(f"\nSaved cleaned data to: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
