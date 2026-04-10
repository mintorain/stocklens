from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.tasks.morning_update import run_full_update

SCHEDULE_CONFIG = {
    "morning_update": {
        "cron": {"day_of_week": "mon-fri", "hour": 8, "minute": 0},
        "func": run_full_update,
    },
    "midday_update": {
        "cron": {"day_of_week": "mon-fri", "hour": 15, "minute": 30},
        "func": run_full_update,
    },
}


def create_scheduler() -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler(timezone="Asia/Seoul")

    for name, config in SCHEDULE_CONFIG.items():
        scheduler.add_job(config["func"], "cron", id=name, **config["cron"])

    return scheduler
