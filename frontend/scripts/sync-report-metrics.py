"""Snapshot inventory-app's version-one report metrics for the HQ frontend.

Run from frontend/ after a deliberate template review. The generated JSON is
checked in so the browser never depends on the adjacent inventory repository.
"""

import json
import sys
from pathlib import Path


frontend = Path(__file__).resolve().parents[1]
inventory = frontend.parent.parent / "inventory-app"
sys.path.insert(0, str(inventory))

from data.team_report_templates import (  # noqa: E402
    DEPARTMENT_TEMPLATES,
    TEAM_REPORT_TEMPLATE_VERSION,
)

if TEAM_REPORT_TEMPLATE_VERSION != 1:
    raise SystemExit("Review the template change before updating the HQ snapshot")

snapshot = {
    template.code: {
        report_type: [
            {
                "key": group.key,
                "title": group.title,
                "metrics": [
                    {"key": metric.key, "label": metric.label, "target": metric.target or ""}
                    for metric in group.metrics
                ],
            }
            for group in getattr(template, f"{report_type}_metrics")
        ]
        for report_type in ("weekly", "monthly")
    }
    for template in DEPARTMENT_TEMPLATES
}

destination = frontend / "src" / "features" / "reports" / "metrics-v1.json"
destination.write_text(json.dumps(snapshot, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
print(f"Wrote {destination}")
