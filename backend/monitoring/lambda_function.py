import urllib.request
import boto3
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from shared.dynamodb import get_region
from shared.logger import get_logger

logger = get_logger(__name__)
sns = boto3.client('sns', region_name=get_region())

def lambda_handler(event, context):
    url = os.environ['URL']
    topic_arn = os.environ['TOPIC_ARN']

    try:
        logger.info(f"Checking frontend URL: {url}")
        response = urllib.request.urlopen(url, timeout=5)
        if response.status != 200:
            raise Exception("Site down")
        logger.info("Frontend health check passed")
    except Exception as e:
        logger.exception("Frontend health check failed")
        sns.publish(
            TopicArn=topic_arn,
            Message=f"Frontend is DOWN! Error: {str(e)}",
            Subject="ALERT: Website Down"
        )
