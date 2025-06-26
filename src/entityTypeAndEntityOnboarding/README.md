# 🧱 Entity Management - Creation Flow

This guide provides comprehensive and step-by-step instructions for managing entities within the SAAS platform, tailored to different user roles and environments. It covers authentication, creation, and mapping of entities to ensure a seamless onboarding and operational experience.

---

## 🔐 Auth Keys & Tokens

Authentication headers required for API calls, based on user roles and the environment.

### 🔸 Org Admin - QA

| Key                     | Value                     |
| ----------------------- | ------------------------- |
| `internal-access-token` | `{internal-access-token}` |
| `X-auth-token`          | `{Token}`                 |

### 🔸 Super Admin - QA

| Key                     | Value                     |
| ----------------------- | ------------------------- |
| `internal-access-token` | `{internal-access-token}` |
| `X-auth-token`          | `{Token}`                 |
| `admin-auth-token`      | `{admin-auth-token}`      |
| `tenantId`              | `shikshagraha`            |
| `orgId`                 | `blr`                     |

---

## 🌐 Origin URLs (Per Organization)

Domain URLs to be passed as the `origin` header during login requests.

| Organization | Origin URL                      |
| ------------ | ------------------------------- |
| Shikshalokam | `shikshalokam-qa.tekdinext.com` |
| Shikshagraha | `shikshagrah-qa.tekdinext.com`  |
| Super Admin  | `default-qa.tekdinext.com`      |

---

## 🔑 Login API

Use this API to authenticate the user and generate a session token (`X-auth-token`). The token is mandatory for all secured API requests.

<details>
<summary>Login API</summary>

```bash
curl --location '{{baseURL}}/user/v1/account/login' \
--header 'Content-Type: application/json' \
--header 'origin: shikshalokam-qa.tekdinext.com' \
--data-raw '{
  "identifier": "email/phone",
  "password": "password"
}'
```

</details>

---

**NOTE**:

-   If you are an **Organization Admin**, please ensure that the headers match the values listed under _Org Admin - QA_.
-   If you are a **Super Admin**, use the credentials and headers mentioned under _Super Admin - QA_.

---

## 🧱 Add Entity Type

Use this API to create a new entity type in the system. An entity type represents a category like `school`, `cluster`, `block`, etc.

<details>
<summary>Add Entity Type API</summary>

```bash
curl --location '{{baseURL}}/entity-management/v1/entityTypes/create' \
--header 'internal-access-token: {internal-access-token}' \
--header 'content-type: application/json' \
--header 'X-auth-token: {{tokenToPass}}' \
--header 'admin-auth-token: {admin-auth-token}' \
--header 'tenantId: shikshagraha' \
--header 'orgid: blr' \
--data '{
  "name": "professional_role",
  "registryDetails": {
    "name": "schoolRegistry"
  },
  "isObservable": true,
  "toBeMappedToParentEntities": true
}'
```

</details>

---

## 🏫 Bulk Upload Entities

Use this API to bulk create entities of a specific type (e.g., schools, teachers) by uploading a formatted CSV file.

📄 **CSV File**: [Karnataka School Upload CSV](https://drive.google.com/file/d/1SwOh11gmhehhrKH7SygA40DpYRE6IIjI/view)

<details>
<summary>Bulk Upload API</summary>

```bash
curl --location '{{baseURL}}/entity-management/v1/entities/bulkCreate?type=school' \
--header 'internal-access-token: {internal-access-token}' \
--header 'content-type: multipart/form-data' \
--header 'x-auth-token: {{TokenToPass}}' \
--form 'entities=@"/home/user4/Downloads/Karnata-upload data SG prod - schoolUpload.csv"'
```

</details>

---

## 🧾 Generate Mapping CSV

This API helps generate a base mapping CSV from the bulk uploaded entity data. The generated CSV will be used to create mappings between parent and child entities.

📄 **CSV File**: [Download Template CSV](https://drive.google.com/file/d/1n9pFGfZKaj77OBXfsDnwL5WEOHzpq6jr/view?usp=sharing)

<details>
<summary>Generate Mapping CSV API</summary>

```bash
curl --location '{{baseURL}}/entity-management/v1/entities/createMappingCsv' \
--header 'x-auth-token: {{TokenToPass}}' \
--header 'content-type: multipart/form-data' \
--header 'internal-access-token: {internal-access-token}' \
--form 'entityCSV=@"/home/user4/Downloads/chunk_0.csv"'
```

</details>

---

## 🔗 Upload Entity Mapping

This API maps child entities to their respective parent entities using the result CSV generated from the previous step (`createMappingCsv`).

📄 **CSV File**: [Sample Mapping Upload CSV](https://drive.google.com/file/d/1SVvi-F0y2YcwNfBpAOYzMZVeh4TbJCxd/view?usp=sharing)

📌 **Note**: Always use the result CSV from the `createMappingCsv` step.

<details>
<summary>Mapping Upload API</summary>

```bash
curl --location '{{baseURL}}/entity-management/v1/entities/mappingUpload' \
--header 'internal-access-token: {internal-access-token}' \
--header 'x-auth-token: {{TokenToPass}}' \
--form 'entityMap=@"/home/user4/Downloads/base64-to-csv-converter (8).csv"'
```

</details>

---

## ✅ Summary of Steps

1. **Login** – Authenticate and retrieve your `X-auth-token`.
2. **Create Entity Type** – Define the category (type) of the entities you want to manage.
3. **Bulk Upload Entities** – Upload a list of entities using a formatted CSV file.
4. **Generate Mapping CSV** – Create a base CSV that outlines relationships between entities.
5. **Upload Entity Mapping** – Finalize the entity hierarchy by uploading the mapping CSV.

---
