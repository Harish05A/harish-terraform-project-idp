import urllib.request
import boto3
import os

sns = boto3.client('sns')

def lambda_handler(event, context):
    url = os.environ['URL']
    topic_arn = os.environ['TOPIC_ARN']

    try:
        response = urllib.request.urlopen(url, timeout=5)
        if response.status != 200:
            raise Exception("Site down")
    except Exception as e:
        sns.publish(
            TopicArn=topic_arn,
            Message=f"Frontend is DOWN! Error: {str(e)}",
            Subject="ALERT: Website Down"
        )