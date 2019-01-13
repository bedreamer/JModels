from celery import Celery
from celery.schedules import crontab
import time


app = Celery('hello', broker='redis://localhost/10', backend='redis://localhost/10')


@app.task
def hello(a, b):
    print('hello world', time.strftime("%Y:-%m-%d %H:%M:%S"))
    return None


app.conf.beat_schedule = {
    'add-every-30-seconds': {
        'task': 'X.tasks.hello',
        'schedule': crontab(minute='*/2'),
        'args': (3, 4)
    },
}