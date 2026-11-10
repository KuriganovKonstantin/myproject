"""
Модуль данных: структуры записей и генератор датасета для индивидуального проекта
Тема: Tech Layoffs & Hiring Trends (ИТИС КФУ)
Автор: Куриганов Константин Витальевич (группа 11-511)
"""

from dataclasses import dataclass, asdict
from typing import List, Optional
import csv
import io


@dataclass
class LayoffRecord:
    record_id: str
    company_name: str
    industry: str
    country: str
    company_size: str
    year: int
    month: int
    date: str  # YYYY-MM-DD
    layoffs_count: int
    workforce_cut_pct: float
    hiring_status: str
    ai_impact_factor: int
    stage: str
    annual_burn_reduction_usd_m: float
    headquarters: str
    source_notes: str = ""


# Реальные компании из технологического сектора
REAL_COMPANIES = [
    {"name": "Google (Alphabet)", "industry": "Search & Cloud", "country": "United States", "size": "Mega-Corp (5000+)", "hq": "Mountain View, CA", "stage": "Post-IPO", "base_cut_pct": 6.0},
    {"name": "Microsoft", "industry": "Cloud & Enterprise SaaS", "country": "United States", "size": "Mega-Corp (5000+)", "hq": "Redmond, WA", "stage": "Post-IPO", "base_cut_pct": 5.0},
    {"name": "Amazon", "industry": "E-Commerce & AWS", "country": "United States", "size": "Mega-Corp (5000+)", "hq": "Seattle, WA", "stage": "Post-IPO", "base_cut_pct": 9.0},
    {"name": "Meta (Facebook)", "industry": "Social Media & VR", "country": "United States", "size": "Mega-Corp (5000+)", "hq": "Menlo Park, CA", "stage": "Post-IPO", "base_cut_pct": 13.0},
    {"name": "Intel Corp.", "industry": "Hardware & Semiconductors", "country": "United States", "size": "Mega-Corp (5000+)", "hq": "Santa Clara, CA", "stage": "Post-IPO", "base_cut_pct": 15.0},
    {"name": "Cisco Systems", "industry": "Networking & Telecom", "country": "United States", "size": "Mega-Corp (5000+)", "hq": "San Jose, CA", "stage": "Post-IPO", "base_cut_pct": 7.0},
    {"name": "Salesforce", "industry": "Enterprise SaaS", "country": "United States", "size": "Mega-Corp (5000+)", "hq": "San Francisco, CA", "stage": "Post-IPO", "base_cut_pct": 10.0},
    {"name": "SAP SE", "industry": "Enterprise SaaS", "country": "Germany", "size": "Mega-Corp (5000+)", "hq": "Walldorf", "stage": "Post-IPO", "base_cut_pct": 8.0},
    {"name": "Dell Technologies", "industry": "Hardware & Infrastructure", "country": "United States", "size": "Mega-Corp (5000+)", "hq": "Round Rock, TX", "stage": "Post-IPO", "base_cut_pct": 10.0},
    {"name": "Genentech / Roche", "industry": "Biotech & HealthTech", "country": "United States", "size": "Enterprise (501-5000)", "hq": "South San Francisco, CA", "stage": "Series D", "base_cut_pct": 11.5},
    {"name": "Klarna Bank", "industry": "Fintech & Crypto", "country": "Sweden", "size": "Enterprise (501-5000)", "hq": "Stockholm", "stage": "Series D", "base_cut_pct": 22.0},
    {"name": "Tesla Inc.", "industry": "Hardware & Semiconductors", "country": "United States", "size": "Mega-Corp (5000+)", "hq": "Austin, TX", "stage": "Post-IPO", "base_cut_pct": 10.2},
    {"name": "Unity Software", "industry": "Gaming & Interactive", "country": "United States", "size": "Enterprise (501-5000)", "hq": "San Francisco, CA", "stage": "Post-IPO", "base_cut_pct": 25.0},
    {"name": "ByteDance (TikTok)", "industry": "Media & Social Networks", "country": "Singapore", "size": "Mega-Corp (5000+)", "hq": "Singapore", "stage": "Private", "base_cut_pct": 3.5},
    {"name": "Snap Inc.", "industry": "Media & Social Networks", "country": "United States", "size": "Enterprise (501-5000)", "hq": "Santa Monica, CA", "stage": "Post-IPO", "base_cut_pct": 10.0},
    {"name": "Chegg Inc.", "industry": "EdTech", "country": "United States", "size": "Mid-Market (51-500)", "hq": "Santa Clara, CA", "stage": "Post-IPO", "base_cut_pct": 23.0},
    {"name": "Duolingo", "industry": "EdTech", "country": "United States", "size": "Mid-Market (51-500)", "hq": "Pittsburgh, PA", "stage": "Post-IPO", "base_cut_pct": 9.8},
    {"name": "UiPath Inc.", "industry": "AI & Machine Learning", "country": "United States", "size": "Enterprise (501-5000)", "hq": "New York, NY", "stage": "Post-IPO", "base_cut_pct": 10.0},
    {"name": "Dropbox", "industry": "Cloud & Infrastructure", "country": "United States", "size": "Enterprise (501-5000)", "hq": "San Francisco, CA", "stage": "Post-IPO", "base_cut_pct": 20.0},
    {"name": "Shopify", "industry": "E-Commerce", "country": "Canada", "size": "Mega-Corp (5000+)", "hq": "Ottawa", "stage": "Post-IPO", "base_cut_pct": 8.5},
    {"name": "Delivery Hero", "industry": "E-Commerce", "country": "Germany", "size": "Mega-Corp (5000+)", "hq": "Berlin", "stage": "Post-IPO", "base_cut_pct": 16.0},
    {"name": "Zomato", "industry": "E-Commerce", "country": "India", "size": "Enterprise (501-5000)", "hq": "Gurugram", "stage": "Post-IPO", "base_cut_pct": 4.0},
    {"name": "Paytm (One97)", "industry": "Fintech & Crypto", "country": "India", "size": "Enterprise (501-5000)", "hq": "Noida", "stage": "Post-IPO", "base_cut_pct": 12.0},
    {"name": "CrowdStrike", "industry": "Cybersecurity", "country": "United States", "size": "Enterprise (501-5000)", "hq": "Austin, TX", "stage": "Post-IPO", "base_cut_pct": 5.0},
    {"name": "Palo Alto Networks", "industry": "Cybersecurity", "country": "United States", "size": "Mega-Corp (5000+)", "hq": "Santa Clara, CA", "stage": "Post-IPO", "base_cut_pct": 3.5},
    {"name": "Grammarly", "industry": "AI & Machine Learning", "country": "United States", "size": "Enterprise (501-5000)", "hq": "San Francisco, CA", "stage": "Series D", "base_cut_pct": 23.0},
    {"name": "Wayfair", "industry": "E-Commerce", "country": "United States", "size": "Mega-Corp (5000+)", "hq": "Boston, MA", "stage": "Post-IPO", "base_cut_pct": 13.0},
    {"name": "Electronic Arts (EA)", "industry": "Gaming & Interactive", "country": "United States", "size": "Mega-Corp (5000+)", "hq": "Redwood City, CA", "stage": "Post-IPO", "base_cut_pct": 5.0},
    {"name": "Ubisoft", "industry": "Gaming & Interactive", "country": "France", "size": "Mega-Corp (5000+)", "hq": "Montreuil", "stage": "Post-IPO", "base_cut_pct": 8.0},
    {"name": "Sony Interactive Ent.", "industry": "Gaming & Interactive", "country": "Japan", "size": "Mega-Corp (5000+)", "hq": "Tokyo", "stage": "Post-IPO", "base_cut_pct": 8.0},
    {"name": "Infosys Tech", "industry": "Enterprise SaaS", "country": "India", "size": "Mega-Corp (5000+)", "hq": "Bengaluru", "stage": "Post-IPO", "base_cut_pct": 2.8},
    {"name": "Synthesia AI", "industry": "AI & Machine Learning", "country": "United Kingdom", "size": "Mid-Market (51-500)", "hq": "London", "stage": "Series C", "base_cut_pct": 14.0},
    {"name": "N26 Mobile Bank", "industry": "Fintech & Crypto", "country": "Germany", "size": "Enterprise (501-5000)", "hq": "Berlin", "stage": "Series D", "base_cut_pct": 15.0},
]

HIRING_STATUSES = [
    "Freeze",
    "Selective",
    "Aggressive AI Roles",
    "Restructuring",
]


class LCG:
    """Детерминированный линейный конгруэнтный генератор (LCG) для воспроизводимости результатов."""
    def __init__(self, seed: int = 42):
        self.state = seed

    def random(self) -> float:
        self.state = (self.state * 1664525 + 1013904223) % 4294967296
        return self.state / 4294967296.0


def generate_dataset(count: int = 1000, seed: int = 2026) -> List[LayoffRecord]:
    """
    Генерирует выборку данных заданного объема (от 1 000 до 100 000+ строк)
    с полным сохранением схемы и критериев задания ИТИС КФУ.
    """
    rng = LCG(seed)
    records: List[LayoffRecord] = []
    num_real = len(REAL_COMPANIES)

    for i in range(count):
        comp = REAL_COMPANIES[int(rng.random() * num_real)]
        year = 2025 if rng.random() > 0.35 else 2026
        month = int(rng.random() * 12) + 1
        day = int(rng.random() * 28) + 1
        date_str = f"{year}-{month:02d}-{day:02d}"

        # Расчет количества увольнений
        if "Mega" in comp["size"]:
            base_cut = 1200
        elif "Enterprise" in comp["size"]:
            base_cut = 350
        else:
            base_cut = 65

        jitter = 0.4 + rng.random() * 1.8
        layoffs = max(10, int(round(base_cut * jitter)))

        base_cut_pct = float(comp["base_cut_pct"])
        cut_pct = min(65.0, max(1.5, round((base_cut_pct * (0.8 + rng.random() * 0.5)), 1)))
        ai_impact = min(10, max(1, int(round(3 + rng.random() * 7))))
        hiring = HIRING_STATUSES[int(rng.random() * len(HIRING_STATUSES))]
        burn_red = round((layoffs * 0.18 + rng.random() * 15.0), 1)

        comp_name = comp["name"] if i < num_real else f"{comp['name']} #{(i % 15) + 1}"
        notes = (
            "AI automation & consolidation cited in SEC filing"
            if ai_impact >= 8
            else "Macroeconomic re-alignment"
        )

        record = LayoffRecord(
            record_id=f"TL-{year}-{i + 1:06d}",
            company_name=comp_name,
            industry=comp["industry"],
            country=comp["country"],
            company_size=comp["size"],
            year=year,
            month=month,
            date=date_str,
            layoffs_count=layoffs,
            workforce_cut_pct=cut_pct,
            hiring_status=hiring,
            ai_impact_factor=ai_impact,
            stage=comp["stage"],
            annual_burn_reduction_usd_m=burn_red,
            headquarters=comp["hq"],
            source_notes=notes,
        )
        records.append(record)

    # Сортировка по дате для временного анализа и Segment Tree
    records.sort(key=lambda r: r.date)
    return records


def parse_csv(csv_content: str) -> List[LayoffRecord]:
    """Парсинг CSV-файла в список объектов LayoffRecord."""
    f = io.StringIO(csv_content.strip())
    reader = csv.DictReader(f)
    records: List[LayoffRecord] = []

    for idx, row in enumerate(reader, start=1):
        year = int(row.get("year", 2025) or 2025)
        month = int(row.get("month", 1) or 1)
        rec_id = row.get("record_id") or f"CSV-{year}-{idx:06d}"
        comp = row.get("company_name") or row.get("company") or "Tech Company"
        ind = row.get("industry") or "Enterprise SaaS"
        country = row.get("country") or row.get("location") or "United States"
        size = row.get("company_size") or row.get("size") or "Enterprise (501-5000)"
        date_val = row.get("date") or f"{year}-{month:02d}-01"

        try:
            layoffs = int(row.get("layoffs_count") or row.get("total_laid_off") or 50)
        except ValueError:
            layoffs = 50

        try:
            cut_pct = float(row.get("workforce_cut_pct") or row.get("percentage") or 10.0)
        except ValueError:
            cut_pct = 10.0

        try:
            ai_factor = int(row.get("ai_impact_factor") or 5)
        except ValueError:
            ai_factor = 5

        try:
            burn = float(row.get("annual_burn_reduction_usd_m") or 12.5)
        except ValueError:
            burn = 12.5

        records.append(
            LayoffRecord(
                record_id=rec_id,
                company_name=comp,
                industry=ind,
                country=country,
                company_size=size,
                year=year,
                month=month,
                date=date_val,
                layoffs_count=layoffs,
                workforce_cut_pct=cut_pct,
                hiring_status=row.get("hiring_status", "Restructuring"),
                ai_impact_factor=ai_factor,
                stage=row.get("stage", "Post-IPO"),
                annual_burn_reduction_usd_m=burn,
                headquarters=row.get("headquarters", "Global"),
                source_notes=row.get("source_notes", ""),
            )
        )

    records.sort(key=lambda r: r.date)
    return records


def export_csv(records: List[LayoffRecord], filepath: str) -> None:
    """Экспорт записей в CSV файл."""
    if not records:
        return
    fieldnames = list(asdict(records[0]).keys())
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in records:
            writer.writerow(asdict(r))
