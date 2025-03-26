import json
import uuid
import datetime
import boto3
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError
import requests
import math
import pytz
import os
from hashlib import sha256
from datetime import datetime, timedelta


def lambda_handler(event, context):
    print(event)
    if event["httpMethod"] == "OPTIONS":
        return {
            "statusCode": 200,
        }

    session_valid, session_data = verify_session(get_cookie(event, "SESSION_ID"))
    api = event["pathParameters"]["api"].split("/")[0]

    if api == "transactions":
        if not session_valid:
            return {
                "statusCode": 401,
            }

        return route_transactions(event, session_data)

    elif api == "budget" and event["httpMethod"] == "GET":
        if not session_valid:
            return {
                "statusCode": 403,
            }

        result = get_budget(event, email=session_data["email"])

        return {
            "statusCode": result["status"],
            "headers": {
                "content-type": "application/json",
            },
            "body": json.dumps(result["body"]),
        }

    elif api == "budget" and event["httpMethod"] == "PUT":
        if not session_valid:
            return {
                "statusCode": 403,
            }

        statusCode = update_budget(event, email=session_data["email"])
        return {
            "statusCode": statusCode,
            "headers": {
                "content-type": "application/json",
            },
        }

    elif api == "sign-up" and event["httpMethod"] == "POST":
        if session_valid:
            return {
                "statusCode": 403,
            }
        return {
            "statusCode": create_account(event),
            "headers": {
                "content-type": "application/json",
            },
        }

    elif api == "sign-in" and event["httpMethod"] == "POST":
        if session_valid:
            return {
                "statusCode": 403,
            }

        statusCode, session_id = verify_account(event)
        return {
            "statusCode": statusCode,
            "headers": {
                "content-type": "application/json",
                "set-cookie": f"SESSION_ID={session_id}; Secure; HttpOnly; SameSite=None;",
            },
            "body": json.dumps(session_valid),
        }
    elif (api == "sign-in" or api == "sign-up") and event["httpMethod"] == "GET":
        if session_valid:
            return {
                "statusCode": 401,
            }
        else:
            return {
                "statusCode": 200,
            }
    elif api == "logout" and event["httpMethod"] == "GET":
        return {
            "statusCode": delete_session(get_cookie(event, "SESSION_ID")),
        }
    else:
        return {
            "statusCode": 404,
        }


def route_transactions(event=None, session_data=None):

    if event["httpMethod"] == "GET":
        if (
            event.get("queryStringParameters")
            and "id" in event["queryStringParameters"]
        ):
            result = get_transaction(
                event,
                email=session_data["email"],
                transaction_id=event["queryStringParameters"]["id"],
            )
        else:
            result = get_transactions(event, email=session_data["email"])

        return {
            "statusCode": result["status"],
            "headers": {
                "content-type": "application/json",
            },
            "body": json.dumps(result["body"]),
        }

    elif event["httpMethod"] == "POST":
        statusCode = insert_transaction(event, email=session_data["email"])
        return {
            "statusCode": statusCode,
            "headers": {
                "content-type": "application/json",
            },
        }

    elif event["httpMethod"] == "DELETE":
        statusCode = delete_transaction(event, email=session_data["email"])
        return {
            "statusCode": statusCode,
            "headers": {
                "content-type": "application/json",
            },
        }

    elif event["httpMethod"] == "PUT":
        statusCode = update_transaction(event, email=session_data["email"])
        return {
            "statusCode": statusCode,
            "headers": {
                "content-type": "application/json",
            },
        }

    else:
        return {
            "statusCode": 404,
        }


def create_session(data=None, dynamodb=None):
    if not dynamodb:
        dynamodb = boto3.resource("dynamodb")

    # Calculate the current time plus 30 days for TTL (in seconds)
    ttl = (datetime.now() + timedelta(days=30)).timestamp()
    session_id = str(uuid.uuid4())
    try:
        table = dynamodb.Table("baas-db")
        table.put_item(
            Item={
                "PK": "SESSION",
                "SK": session_id,
                "email": data["email"],
                "name": data["name"],
                "ExpireAt": int(ttl),  # Add the TTL attribute
            }
        )

    except Exception as e:
        raise Exception("Something went wrong")

    return session_id


def verify_session(session_id, dynamodb=None):
    if session_id:
        if not dynamodb:
            dynamodb = boto3.resource("dynamodb")

        table = dynamodb.Table("baas-db")
        response = table.query(
            KeyConditionExpression=Key("PK").eq("SESSION") & Key("SK").eq(session_id),
        )

        if bool(response["Items"]):
            return True, response["Items"][0]
        else:
            return False, {}
    else:
        return False, {}


def delete_session(session_id, dynamodb=None):
    if not dynamodb:
        dynamodb = boto3.resource("dynamodb")

    try:
        table = dynamodb.Table("baas-db")
        table.delete_item(Key={"PK": "SESSION", "SK": session_id})
        status = 200

    except Exception as e:
        print(e)
        status = 500

    return status


def create_account(event=None, dynamodb=None):
    data = json.loads(event["body"])

    if not dynamodb:
        dynamodb = boto3.resource("dynamodb")

    try:
        if not account_exist(event, dynamodb):
            table = dynamodb.Table("baas-db")
            table.put_item(
                Item={
                    "PK": "ACCOUNT",
                    "SK": data["email"],
                    "password": sha256(data["password"].encode()).hexdigest(),
                    "name": data["name"],
                    "budget": "0",
                }
            )

            status = 201
        else:
            status = 409
    except Exception as e:
        print(e)
        status = 500

    return status


def verify_account(event=None, dynamodb=None):
    data = json.loads(event["body"])

    if not dynamodb:
        dynamodb = boto3.resource("dynamodb")

    try:
        table = dynamodb.Table("baas-db")

        response = table.query(
            KeyConditionExpression=Key("PK").eq("ACCOUNT")
            & Key("SK").eq(data["email"]),
        )

        if (
            bool(response["Items"])
            and response["Items"][0]["password"]
            == sha256(data["password"].encode()).hexdigest()
        ):
            session_id = create_session(
                {
                    "email": response["Items"][0]["SK"],
                    "name": response["Items"][0]["name"],
                }
            )
            return 200, session_id
        else:
            return 401, ""

    except ClientError as e:
        return 500, ""


def account_exist(event=None, dynamodb=None):
    data = json.loads(event["body"])

    if not dynamodb:
        dynamodb = boto3.resource("dynamodb")

    try:
        table = dynamodb.Table("baas-db")

        response = table.query(
            KeyConditionExpression=Key("PK").eq("ACCOUNT")
            & Key("SK").eq(data["email"]),
        )

        return bool(response["Items"])

    except ClientError as e:
        raise Exception("Something went wrong")


def get_budget(event=None, dynamodb=None, email=None):
    if not dynamodb:
        dynamodb = boto3.resource("dynamodb")

    budget = ""
    try:
        table = dynamodb.Table("baas-db")
        response = table.query(
            KeyConditionExpression=Key("PK").eq("ACCOUNT") & Key("SK").eq(email),
        )

        budget = response["Items"][0]["budget"]
        status = 200

    except ClientError as e:
        print(e)
        status = 500

    return {"status": status, "body": {"data": budget}}


def get_transactions(event=None, dynamodb=None, email=None):
    if not dynamodb:
        dynamodb = boto3.resource("dynamodb")

    transactions = []
    try:
        table = dynamodb.Table("baas-db")
        response = table.query(
            KeyConditionExpression=Key("PK").eq("TRANSACTION")
            & Key("SK").begins_with(f"{email}_"),
        )

        transactions = response["Items"]
        status = 200

    except ClientError as e:
        print(e)
        status = 500

    return {"status": status, "body": {"data": transactions}}


def get_transaction(event=None, dynamodb=None, email=None, transaction_id=None):
    if not dynamodb:
        dynamodb = boto3.resource("dynamodb")

    transaction = {}
    try:
        table = dynamodb.Table("baas-db")
        response = table.query(
            KeyConditionExpression=Key("PK").eq("TRANSACTION")
            & Key("SK").eq(f"{email}_{transaction_id}"),
        )

        transaction = response["Items"][0]
        status = 200

    except ClientError as e:
        print(e)
        status = 500

    return {"status": status, "body": {"data": transaction}}


def insert_transaction(event=None, dynamodb=None, email=None):
    data = json.loads(event["body"])

    if not dynamodb:
        dynamodb = boto3.resource("dynamodb")

    try:
        ai_responses = format_description_to_json(data["description"])

        table = dynamodb.Table("baas-db")

        for response in ai_responses:
            if math.isnan(response["amount"]):
                raise Exception("Amount not a number")

            converted_amount = convert_to_sgd(response["amount"], response["currency"])

            # Get the current datetime in Singapore time zone
            singapore_tz = pytz.timezone("Asia/Singapore")
            singapore_time = datetime.now(tz=singapore_tz).isoformat()

            table.put_item(
                Item={
                    "PK": "TRANSACTION",
                    "SK": f"{email}_{str(uuid.uuid4())}",
                    "date": singapore_time,
                    "simple_description": response["name"],
                    "original_description": data["description"],
                    "category": response["category"],
                    "sgd_amount": str(converted_amount),
                    "original_amount": str(response["amount"]),
                    "original_currency": str(response["currency"]),
                }
            )

        status = 201
    except Exception as e:
        print(e)
        status = 500

    return status


def format_description_to_json(description):
    # URL for OpenAI's completions endpoint
    url = "https://api.openai.com/v1/chat/completions"

    # The API key for authorization
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {os.environ.get('OPENAI_API_KEY')}",
    }

    # The data payload for the request, formatted as JSON
    payload = {
        "model": "gpt-4o-mini",
        "temperature": 0,
        "messages": [
            {
                "role": "system",
                "content": "You are an financial accountant that can translate text description to JSON. If there are more than 1 transaction in the description, separate them. Output should only be an array JSON",
            },
            {
                "role": "user",
                "content": f"""
                    Given a description generate a name (no more than 5 words) by summarising the description, select a suitable category from the provided set of categories, calculate the correct total amount and extract the currency used. 
                    These values must be inserted into the specified JSON format. 
                    If no currency is stated, set it as SGD. Do not perform any currency conversion.
                    If no value is provided omit the entire json
                    
                    Category: Shopping, Groceries, Subscriptions, Loans, Housing, Transport, Dining, Utilities, Transfers, Taxes, Utilities, Healthcare, Insurance, Entertainment, Miscellaneous
                    Description:  {description}
                    JSON format: 
                    [
                        {{
                            name: <some_value>,
                            category: <some_value>,
                            amount: <some_value to 2 decimal >,
                            currency: <some_value>
                        }}
                    ]
                """,
            },
        ],
    }

    # Send the request and receive the response
    response = requests.post(url, headers=headers, data=json.dumps(payload))

    # Parse the response content to a Python dict
    response_json = response.json()

    # Extract the desired output from the response
    try:
        return json.loads(response_json["choices"][0]["message"]["content"])
    except KeyError:
        # In case of an error or unexpected response structure
        return "An error occurred while processing the request."


def get_exchange_rate(from_currency):
    url = f"https://open.er-api.com/v6/latest/{from_currency}"
    response = requests.get(url)
    data = response.json()

    return data["rates"]["SGD"]


def convert_to_sgd(amount, from_currency):
    if from_currency != "SGD":
        exchange_rate = get_exchange_rate(from_currency)
        return amount * exchange_rate
    return amount


def get_cookie(event, cookie_name):
    try:
        cookies = event["headers"]["Cookie"]
        cookie_arr = cookies.split(";")

        for cookie in cookie_arr:
            print(cookie)
            if cookie.split("=")[0] == cookie_name:
                if cookie.split("=")[1]:
                    return cookie.split("=")[1]
                else:
                    return False
        return False
    except:
        return False


def delete_transaction(event=None, dynamodb=None, email=None):
    if not dynamodb:
        dynamodb = boto3.resource("dynamodb")

    try:
        transaction_id = event["pathParameters"]["api"].split("/")[-1]
        table = dynamodb.Table("baas-db")
        table.delete_item(Key={"PK": "TRANSACTION", "SK": f"{email}_{transaction_id}"})
        return 200
    except Exception as e:
        print(e)
        return 500


def update_transaction(event=None, dynamodb=None, email=None):
    if not dynamodb:
        dynamodb = boto3.resource("dynamodb")

    try:
        transaction_id = event["pathParameters"]["api"].split("/")[-1]
        data = json.loads(event["body"])

        table = dynamodb.Table("baas-db")
        # Get existing transaction
        response = table.get_item(
            Key={"PK": "TRANSACTION", "SK": f"{email}_{transaction_id}"}
        )

        if "Item" not in response:
            return 404

        item = response["Item"]

        # Update fields if provided in request
        if "date" in data:
            item["date"] = data["date"]
        if "simple_description" in data:
            item["simple_description"] = data["simple_description"]
        if "category" in data:
            item["category"] = data["category"]
        if "original_amount" in data:
            item["original_amount"] = str(data["original_amount"])
        if "original_currency" in data:
            item["original_currency"] = data["original_currency"].upper()
            # Recalculate SGD amount if currency changed
            item["sgd_amount"] = str(
                convert_to_sgd(
                    float(item["original_amount"]), item["original_currency"]
                )
            )

        # Save updated transaction
        table.put_item(Item=item)
        return 200

    except Exception as e:
        print(e)
        return 500


def update_budget(event=None, dynamodb=None, email=None):
    if not dynamodb:
        dynamodb = boto3.resource("dynamodb")

    try:
        data = json.loads(event["body"])

        table = dynamodb.Table("baas-db")
        # Get existing transaction
        response = table.get_item(Key={"PK": "ACCOUNT", "SK": email})

        if "Item" not in response:
            return 404

        item = response["Item"]

        # Update fields if provided in request
        if "budget" in data:
            item["budget"] = str(data["budget"])

        # Save updated transaction
        table.put_item(Item=item)
        return 200

    except Exception as e:
        print(e)
        return 500
