AnythingLLM Developer API
 1.0.0 
OAS 3.0

API endpoints that enable programmatic reading, writing, and updating of your AnythingLLM instance. UI supplied by Swagger.io.

Servers
/api
Authorize
Authentication
GET
/v1/auth

Verify the attached Authentication header contains a valid API token.

Parameters
Try it out

No parameters

Responses
Code	Description	Links
200	

Valid auth token was found.

Media type
application/json
Controls Accept header.
Example Value
Schema
{
  "authenticated": true
}
	No links
403	

Forbidden

Media type
application/json
application/xml
Example Value
Schema
{
  "message": "Invalid API Key"
}
	No links
Admin
GET
/v1/admin/is-multi-user-mode
GET
/v1/admin/users
POST
/v1/admin/users/new
POST
/v1/admin/users/{id}
DELETE
/v1/admin/users/{id}
GET
/v1/admin/invites
POST
/v1/admin/invite/new
DELETE
/v1/admin/invite/{id}
GET
/v1/admin/workspaces/{workspaceId}/users
POST
/v1/admin/workspaces/{workspaceId}/update-users
POST
/v1/admin/workspaces/{workspaceSlug}/manage-users
POST
/v1/admin/workspace-chats
POST
/v1/admin/preferences
Documents
POST
/v1/document/upload
POST
/v1/document/upload/{folderName}
POST
/v1/document/upload-link
POST
/v1/document/raw-text
GET
/v1/documents
GET
/v1/documents/folder/{folderName}
GET
/v1/document/accepted-file-types
GET
/v1/document/metadata-schema
GET
/v1/document/{docName}
POST
/v1/document/create-folder
DELETE
/v1/document/remove-folder
POST
/v1/document/move-files
Workspaces
POST
/v1/workspace/new
GET
/v1/workspaces
GET
/v1/workspace/{slug}
DELETE
/v1/workspace/{slug}
POST
/v1/workspace/{slug}/update
GET
/v1/workspace/{slug}/chats
POST
/v1/workspace/{slug}/update-embeddings
POST
/v1/workspace/{slug}/update-pin
POST
/v1/workspace/{slug}/chat
POST
/v1/workspace/{slug}/stream-chat
POST
/v1/workspace/{slug}/vector-search
System Settings
GET
/v1/system/env-dump
GET
/v1/system
GET
/v1/system/vector-count
POST
/v1/system/update-env
GET
/v1/system/export-chats
DELETE
/v1/system/remove-documents
Workspace Threads
POST
/v1/workspace/{slug}/thread/new
POST
/v1/workspace/{slug}/thread/{threadSlug}/update
DELETE
/v1/workspace/{slug}/thread/{threadSlug}
GET
/v1/workspace/{slug}/thread/{threadSlug}/chats
POST
/v1/workspace/{slug}/thread/{threadSlug}/chat
POST
/v1/workspace/{slug}/thread/{threadSlug}/stream-chat
User Management
GET
/v1/users
GET
/v1/users/{id}/issue-auth-token
OpenAI Compatible Endpoints
GET
/v1/openai/models
POST
/v1/openai/chat/completions
POST
/v1/openai/embeddings
GET
/v1/openai/vector_stores
Embed
GET
/v1/embed
GET
/v1/embed/{embedUuid}/chats
GET
/v1/embed/{embedUuid}/chats/{sessionUuid}
POST
/v1/embed/new
POST
/v1/embed/{embedUuid}
DELETE
/v1/embed/{embedUuid}
Schemas
InvalidAPIKey