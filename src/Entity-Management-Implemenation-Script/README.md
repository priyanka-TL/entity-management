# Python scripts for entity-management implementation

Python script to add entityType, entities, Create mapping CSV and mapping the entities .

### Resource templates

-   [entityFile](https://docs.google.com/spreadsheets/d/1AnPf7t9lD7hiaqxDEnkkTMj0nFKlugBF/edit?usp=sharing&ouid=113799545932705393937&rtpof=true&sd=true)

-   Pull the code from latest release branch
-   To clone the repository
    ` git clone -b latestBranch <git-link>`
-   Navigate to Entity-Management-implementation-Script folder
    ` ENTITY-MANAGEMENT/src/Entity-Management-implementation-Script/main.py`
-   create a virtual environment in python.
    `python3 -m venv path/to/virtualEnv`
-   Once the virtual environment is created, activate the virtual environment.
    In Linux
    `source { relative path to virtualEnv}/bin/activate`
    In Windows
    `{ relative path to virtualEnv}/Scripts/activate`
-   Install all the dependencies using requirement.txt using following command.
    ` pip3 install -r requirement.txt`
-   Make sure there are no errors in the install.
-   If there are any errors in the install, try to install the same version of the libraries seperatly.
-   Download the user given template and save it in the same file where the code is hosted.
-   There are TWO Command to run the script.

`Add valid credentials for email and password in the config.ini file under the [keycloakapibody] section for respected environment (example: dev,QA,local). The config.ini file should be structured as follows:`

-   [keyclockapibody]
    email = your_email@example.com
    password = your_password

`Replace your_internal_access_token with the actual token value. Ensure add actual token wile trying to run the script`

`For sample files, you can refer to the Sample Templates folder which contains sample CSV files to run the script.`

i. To run the script :

-   for QA
        ` python3 main.py --env QA --EntityFile EntityManagament.xlsx`
    -   This command will upload all the data from EntityManagament.xlsx to the QA environment.
    -for DEV
        ` python3 main.py --env dev --EntityFile EntityManagament.xlsx`
    -   This command will upload all the data from EntityManagament.xlsx to the development environment.
    -for LOCAL
        ` python3 main.py --env local --EntityFile EntityManagament.xlsx`
    -   This command will upload all the data from EntityManagament.xlsx to the local environment.
    -for PROD
        ` python3 main.py --env PROD --EntityFile EntityManagament.xlsx`
    -   This command will upload all the data from EntityManagament.xlsx to the local environment.
       

