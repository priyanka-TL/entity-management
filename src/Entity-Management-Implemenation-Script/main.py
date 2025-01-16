import imaplib
import base64
import os
import time
from configparser import ConfigParser, ExtendedInterpolation
import wget
import urllib
import xlrd
import uuid
import csv
from bson.objectid import ObjectId
import json
from datetime import datetime
import requests
from difflib import get_close_matches
from requests import post, get, delete
import sys
import time
import xlwt
import xlutils
from xlutils.copy import copy
import shutil
import re
from xlrd import open_workbook
from xlutils.copy import copy as xl_copy
import logging
import logging.handlers
import time
from logging.handlers import TimedRotatingFileHandler
import xlsxwriter
import argparse
import sys
from os import path
import pandas as pd
import openpyxl
from openpyxl import Workbook
from openpyxl.styles import Color, PatternFill, Font, Border
from openpyxl.styles import colors
from openpyxl.cell import Cell
import gdown
from mimetypes import guess_extension

# get current working directory
currentDirectory = os.getcwd()

# Read config file 
config = ConfigParser()
config.read('common_config/config.ini')


# email regex
regex = "\"?([-a-zA-Z0-9.`?{}]+@\w+\.\w+)\"?"

# Global variable declaration
criteriaLookUp = dict()
millisecond = None
environment = None
pointBasedValue = None
entityType = None
allow_multiple_submissions = None
scopeEntityType = ""
programName = None
userEntity = None
roles = ""
mainRole = ""
dictCritLookUp = {}
isProgramnamePresent = None
solutionLanguage = None
keyWords = None
entityTypeId = None
solutionDescription = None
creator = None
criteriaName = None
API_log = None
listOfFoundRoles = []
entityToUpload = None
criteriaLookUp = dict()
themesSheetList = []
themeRubricFileObj = dict()
criteriaLevelsReport = False
ecm_sections = dict()
criteriaLevelsCount = 0
numberOfResponses = 0
criteriaIdNameDict = dict()
criteriaLevels = list()
matchedShikshalokamLoginId = None
scopeEntities = []
scopeRoles = []
countImps = 0
ecmToSection = dict()
entitiesPGM = []
stateEntitiesPGM = []
entitiesPGMID = []
entitiesType = []
solutionRolesArr = []
startDateOfResource = None
endDateOfResource = None
startDateOfProgram = None
endDateOfProgram = None
orgIds = []
OrgName = []
ccRootOrgName = None
ccRootOrgId  = None
certificatetemplateid = None
question_sequence_arr = []


# Generate access token for the APIs. 
def generateAccessToken():
    # production search user api - start
    headerKeyClockUser = {'Content-Type': config.get(environment, 'content-type')}
    loginBody = {
        'email' : config.get(environment, 'email'),
        'password' : config.get(environment, 'password')
    }
    responseKeyClockUser = requests.post(config.get(environment, 'elevateuserhost') + config.get(environment, 'userlogin'), headers=headerKeyClockUser, json=loginBody)
    messageArr = []
    messageArr.append("URL : " + str(config.get(environment, 'userlogin')))
    messageArr.append("Body : " + str(config.get(environment, 'keyclockAPIBody')))
    messageArr.append("Status Code : " + str(responseKeyClockUser.status_code))
    if responseKeyClockUser.status_code == 200:
        responseKeyClockUser = responseKeyClockUser.json()
        accessTokenUser = responseKeyClockUser['result']['access_token']
        print("--->Access Token Generated!")
        return accessTokenUser
    
    print("Error in generating Access token")
    print("Status code : " + str(responseKeyClockUser.status_code))
    terminatingMessage("Please check API logs.")

def terminatingMessage(message):
    print(message)
    exit(1)

def convert_sheets_to_csv(programFile):
    # Define the output folder
    output_folder = "EntityManagementCSV"
    
    # Create the folder if it doesn't exist
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
    
    # Load the Excel file
    try:
        excel_data = pd.ExcelFile(programFile)
    except Exception as e:
        print(f"Error loading Excel file: {e}")
        return
    
    # Iterate over each sheet in the Excel file
    for sheet_name in excel_data.sheet_names:
        try:
            # Read the sheet into a DataFrame
            sheet_data = excel_data.parse(sheet_name)
            
            # Define the CSV file path
            csv_file_path = os.path.join(output_folder, f"{sheet_name}.csv")
            
            # Save the DataFrame to CSV
            sheet_data.to_csv(csv_file_path, index=False)
            print(f"Saved {sheet_name} to {csv_file_path}")
        except Exception as e:
            print(f"Error processing sheet '{sheet_name}': {e}")



def EntityTypeCreate(accessToken):
          
        headerEntityTypeBulkCreateApi = {
            'X-auth-token': accessToken,
            'internal-access-token': config.get(environment, 'internal-access-token'),
            # 'content-type':'multipart/form-data'
        }
        csv_file_path = './EntityManagementCSV/EntityType.csv'
        file_entity_type = open(csv_file_path, 'rb')
        # Attach the file in the correct form-data format
        filesEntityType = {
            'entityTypes': (os.path.basename(csv_file_path), file_entity_type, 'text/csv')
        }
        
        urlEntityTypeBulkCreateApi = config.get(environment, 'elevateentityhost') + config.get(environment, 'EntityTypeBulkCreate')
        responseEntityTypeBulkCreateApi = requests.post(url=urlEntityTypeBulkCreateApi, headers=headerEntityTypeBulkCreateApi,files=filesEntityType)       
        if responseEntityTypeBulkCreateApi.status_code == 200:
            print('EntityTypeBulkCreateApi Success')
            
        else:
            print("Response : " + str(urlEntityTypeBulkCreateApi))
            terminatingMessage("--->Entity Type Bulk Create failed.")


def EntitiesCreate(accessToken):
    headerEntitiesCreateApi = {
        'X-auth-token': accessToken,
        'internal-access-token': config.get(environment, 'internal-access-token'),
    }
    print(headerEntitiesCreateApi,"line no 214")
    # List of entity types
    Entities = ["state", "district", "block", "cluster", "school"]

    # Iterate over each entity in the Entities list
    for entity in Entities:
        csv_file_path = f'./EntityManagementCSV/{entity}.csv'  # Dynamically pick the file for the current entity

        try:
            # Open the CSV file
            with open(csv_file_path, 'rb') as file_entity_type:
                # Attach the file in the correct form-data format
                filesEntities = {
                    'entities': (os.path.basename(csv_file_path), file_entity_type, 'text/csv')
                }

                # Construct the dynamic URL for the current entity
                urlEntitiesCreateApi = (
                    config.get(environment, 'elevateentityhost') +
                    config.get(environment, 'EntitiesBulkCreate') +
                    f"{entity}"
                )

                # Make the POST request
                responseEntitiesCreateApi = requests.post(
                    url=urlEntitiesCreateApi,
                    headers=headerEntitiesCreateApi,
                    files=filesEntities
                )

                # Handle success or failure
                if responseEntitiesCreateApi.status_code == 200:
                    print(f'Successfully uploaded {entity} data.')
                else:
                    print(
                        f"Failed to upload {entity} data. Status code: {responseEntitiesCreateApi.status_code}, Response: {responseEntitiesCreateApi.text}"
                    )
                    terminatingMessage(f"--->Upload failed for {entity}.")
        except FileNotFoundError:
            print(f"File {csv_file_path} not found. Skipping {entity}.")
        except Exception as e:
            print(f"An error occurred while processing {entity}: {e}")
            terminatingMessage(f"--->An error occurred for {entity}.")


def GeneratMappingCSV(accessToken):
    headerGeneratMappingCSVAPI = {
        'X-auth-token': accessToken,
        'internal-access-token': config.get(environment, 'internal-access-token'),
    }

    csv_file_path = './EntityManagementCSV/entityCSV.csv'
    with open(csv_file_path, 'rb') as file_entity_type:
        # Attach the file in the correct form-data format
        filesMappingCSV = {
            'entityCSV': (os.path.basename(csv_file_path), file_entity_type, 'text/csv')
        }

        urlGeneratMappingCSVApi = config.get(environment, 'elevateentityhost') + config.get(environment, 'GeneratMappingCSVAPI')

        # Make the POST request
        responseGeneratMappingCSVAPI = requests.post(
            url=urlGeneratMappingCSVApi,
            headers=headerGeneratMappingCSVAPI,
            files=filesMappingCSV
        )
        # Process the response
        if responseGeneratMappingCSVAPI.status_code == 200:
            print('EntityTypeBulkCreateApi Success')

            # Parse the JSON response
            response_data = responseGeneratMappingCSVAPI.json()
            parent_ids = response_data['result']['parentEntityIds']
            child_ids = response_data['result']['childEntityIds']

            # Filepath for the output CSV
            output_csv_path = './EntityManagementCSV/mapping.csv'

            # Create and write the CSV
            with open(output_csv_path, 'w', newline='') as csvfile:
                csvwriter = csv.writer(csvfile)

                # Write the headers
                csvwriter.writerow(['parentEntiyId', 'childEntityId'])

                # Write the rows
                for parent, child in zip(parent_ids, child_ids):
                    csvwriter.writerow([parent, child])

            print(f"Mapping CSV successfully created at {output_csv_path}")
        else:
            print("Response : " + str(responseGeneratMappingCSVAPI.text))
            terminatingMessage("---> Generating Mapping CSV  failed.")



def MappingEntities(accessToken):
        headerMappingEntitiesApi = {
            'X-auth-token': accessToken,
            'internal-access-token': config.get(environment, 'internal-access-token'),
        }
        csv_file_path = './EntityManagementCSV/mapping.csv'
        file_entity_type = open(csv_file_path, 'rb')
        # Attach the file in the correct form-data format
        filesMappingEntities = {
            'entityMap': (os.path.basename(csv_file_path), file_entity_type, 'text/csv')
        }
        
        urlMappingEntitiesApi = config.get(environment, 'elevateentityhost') + config.get(environment, 'MappingEntities')
        responseMappingEntitiesApiApi = requests.post(url=urlMappingEntitiesApi, headers=headerMappingEntitiesApi,files=filesMappingEntities)
        if responseMappingEntitiesApiApi.status_code == 200:
            print('Mapping Entities Success')
        else:
            print("Response : " + str(urlMappingEntitiesApi))
            terminatingMessage("--->Entity Mapping failed.")



def createUserData(accessToken):
    header_create_user = {
        'X-auth-token': accessToken,
        'internal-access-token': config.get(environment, 'internal-access-token'),
        'content-type': 'application/json'
    }

    csv_file_path = './EntityManagementCSV/UserExtension.csv'

    # Open the CSV file
    with open(csv_file_path, mode='r') as csvfile:
        reader = csv.DictReader(csvfile)

        # Process each row in the CSV
        for row in reader:
            try:
                # Extract relevant data from the row
                title = row['title']
                user_role_id = row['userRoleId']
                code = row['code']
                entity_type = row['entityType']

                # Call EntityTypeFind and get entityTypes array
                entity_types = EntityTypeFind(entity_type)
                # Construct payload
                user_payload = {
                    "title": title,
                    "userRoleId": user_role_id,
                    "code": code,
                    "status": "ACTIVE",
                    "entityTypes": entity_types
                }

                # Make the API call to create user data
                url_create_user_api = config.get(environment, 'elevateentityhost') + config.get(environment, 'CreateUserData')
                response = requests.post(
                    url=url_create_user_api,
                    headers=header_create_user,
                    data=json.dumps(user_payload)
                )
                if response.status_code == 200:
                    print(f"User creation succeeded for title: {title}")
                else:
                    print(f"User creation failed for title: {title}")
                    print(f"Response: {response.text}")
                    # Stop processing further rows if any row fails
                    break

            except Exception as e:
                print(f"Error processing row: {row}. Error: {str(e)}")
                break

def EntityTypeFind(entity_type):
    header_entity_type = {
        'internal-access-token': config.get(environment, 'internal-access-token'),
        'content-type': 'application/json'
    }

    entity_payload = {
        "query": {
            "name": entity_type.strip(),
        },
        "projection": [
            "name"
        ]
    }

    url_entity_type_find_api = config.get(environment, 'elevateentityhost') + config.get(environment, 'EntityTypeFind')
    response = requests.post(
        url=url_entity_type_find_api,
        headers=header_entity_type,
        data=json.dumps(entity_payload)
    )

    if response.status_code == 200:
        response_data = response.json()
        print(f"Entity type found: {response_data}")

        # Ensure the result is a list and has at least one item
        result = response_data.get("result", [])
        if isinstance(result, list) and len(result) > 0:
            entity_type_id = result[0].get("_id")  # Access the first element of the list
            return [
                {
                    "entityType": entity_type,
                    "entityTypeId": entity_type_id
                }
            ]
        else:
            raise Exception(f"No valid entity type found for: {entity_type}")
    else:
        print(f"Failed to find entity type: {entity_type}")
        print(f"Response: {response.text}")
        raise Exception(f"Entity type lookup failed for: {entity_type}")



def valid_file(param):
    base, ext = os.path.splitext(param)
    if ext.lower() not in ('.xlsx'):
        raise argparse.ArgumentTypeError('File must have a csv extension')
    return param


# function to check environment 
def envCheck():
    try:
        config.get(environment, 'userlogin')
        return True
    except Exception as e:
        print(e)
        return False


# Main function were all the function def are called
def mainFunc(programFile, millisecond):
        convert_sheets_to_csv(programFile)
        accessToken = generateAccessToken()
        EntityTypeCreate(accessToken)
        EntitiesCreate(accessToken)
        GeneratMappingCSV(accessToken)
        MappingEntities(accessToken)
        createUserData(accessToken)
                   
                                                                                                                   

#main execution
start_time = time.time()
parser = argparse.ArgumentParser()
parser.add_argument('--EntityFile', type=valid_file)
parser.add_argument('--env', '--env')
argument = parser.parse_args()
programFile = argument.EntityFile
environment = argument.env
millisecond = int(time.time() * 1000)

if envCheck():
    print("=================== Environment set to " + str(environment) + "=====================")
else:
    terminatingMessage(str(environment) + " is an invalid environment")
# MainFilePath = createFileStructForProgram(programFile)
wbPgm = xlrd.open_workbook(programFile, on_demand=True)
sheetNames = wbPgm.sheet_names()
pgmSheets = ["EntityType", "state", "district", "block", "cluster", "school", "entityCSV","UserExtension"]

if len(sheetNames) == len(pgmSheets) and sheetNames == pgmSheets:
    print("--->Entity Managament Template detected.<---")
    millisecond = int(time.time() * 1000)
    mainFunc(programFile, millisecond)
    end_time = time.time()

else:
      print("-----> Entity Management Template Not Valid")
end_time = time.time()

print("Execution time in sec : " + str(end_time - start_time))