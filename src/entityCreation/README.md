# 🧱 Entity Management - Creation Flow

This guide provides step-by-step instructions to manage entities in the SAAS platform across different roles and environments.

---

## 🔐 Auth Keys & Tokens

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

| Organization | Origin URL                      |
| ------------ | ------------------------------- |
| Shikshalokam | `shikshalokam-qa.tekdinext.com` |
| Shikshagraha | `shikshagrah-qa.tekdinext.com`  |
| Super Admin  | `default-qa.tekdinext.com`      |

---

## 🔑 Login API

<details>
<summary>Login API</summary>

```bash
curl --location 'https://saas-qa.tekdinext.com/user/v1/account/login' \
--header 'Content-Type: application/json' \
--header 'origin: shikshalokam-qa.tekdinext.com' \
--data-raw '{
  "identifier": "orgadmin@sl.com",
  "password": "PASSword###11"
}'
```

</details>

---

**NOTE**: If you are an Organization Admin, please ensure that the headers include the values specified under the Organization Admin column.
If you are a Super Admin, please include the corresponding values from the Super Admin column in the request headers.

## 🧱 Add Entity Type

<details>
<summary>Add Entity Type API</summary>

```bash
curl --location 'https://saas-qa.tekdinext.com/entity-management/v1/entityTypes/create' \
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

**CSV File**: [Karnataka School Upload CSV](https://drive.google.com/file/d/1SwOh11gmhehhrKH7SygA40DpYRE6IIjI/view)

<details>
<summary>Bulk Upload API</summary>

```bash
curl --location 'https://saas-qa.tekdinext.com/entity-management/v1/entities/bulkCreate?type=school' \
--header 'internal-access-token: {internal-access-token}' \
--header 'content-type: multipart/form-data' \
--header 'x-auth-token: {{TokenToPass}}' \
--form 'entities=@"/home/user4/Downloads/Karnata-upload data SG prod - schoolUpload.csv"'
```

</details>

---

## 🧾 Generate Mapping CSV

**CSV File**: [CSV to Generate Mapping Upload CSV ](https://drive.google.com/file/d/1n9pFGfZKaj77OBXfsDnwL5WEOHzpq6jr/view?usp=sharing)

<details>
<summary>Generate Mapping CSV API</summary>

```bash
curl --location 'https://saas-qa.tekdinext.com/admin-entity-management/v1/entities/createMappingCsv' \
--header 'x-auth-token: {{TokenToPass}}' \
--header 'content-type: multipart/form-data' \
--header 'internal-access-token: {internal-access-token}' \
--form 'entityCSV=@"/home/user4/Downloads/chunk_0.csv"'
```

</details>

---

## 🔗 Upload Entity Mapping

**CSV File**: [Mapping Upload CSV](https://drive.google.com/file/d/1SVvi-F0y2YcwNfBpAOYzMZVeh4TbJCxd/view?usp=sharing)

**Note**: Please ensure that the result CSV generated from the createMappingCsv function is passed accordingly.

<details>
<summary>Mapping Upload API</summary>

```bash
curl --location 'https://saas-qa.tekdinext.com/entity-management/v1/entities/mappingUpload' \
--header 'internal-access-token: {internal-access-token}' \
--header 'x-auth-token: {{TokenToPass}}' \
--form 'entityMap=@"/home/user4/Downloads/base64-to-csv-converter (8).csv"'
```

</details>
