export const DEFAULT_CONFIG = {
  // Base configuration
  WEB_NODE_ENV: "development",
  WEB_HOSTNAME_API: "localhost",
  WEB_PORT_API: "3001",
  WEB_PORT: "3000",
  WEB_NEXTAUTH_URL: "http://localhost:3000",
  
  API_NODE_ENV: "development",
  API_LOG_LEVEL: "error",
  API_LOG_PRETTY: "true",
  API_HOST: "0.0.0.0",
  API_PORT: "3001",
  API_RATE_MAX_REQUEST: "100",
  API_RATE_INTERVAL: "1000",
  API_JWT_EXPIRES_IN: "365d",
  API_JWT_REFRESH_EXPIRES_IN: "7d",
  
  GLOBAL_API_CONTAINER_NAME: "kodus-orchestrator-prod",

  // Database
  API_DATABASE_ENV: "development",
  API_PG_DB_USERNAME: "kodusdev",
  API_PG_DB_DATABASE: "kodus_db",
  API_PG_DB_HOST: "db_kodus_postgres",
  API_PG_DB_PORT: "5432",

  API_MG_DB_USERNAME: "kodusdev",
  API_MG_DB_DATABASE: "kodus_db",
  API_MG_DB_HOST: "db_kodus_mongodb",
  API_MG_DB_PORT: "27017",
  API_MG_DB_PRODUCTION_CONFIG: "",

  // LLM Models
  API_LLM_MODEL_CHATGPT_3_5_TURBO: "gpt-4o-mini",
  API_LLM_MODEL_CHATGPT_3_5_TURBO_16K: "gpt-4o-mini",
  API_LLM_MODEL_CHATGPT_4: "gpt-4o-mini",
  API_LLM_MODEL_CHATGPT_4_TURBO: "gpt-4o-mini",
  API_LLM_MODEL_CHATGPT_4_ALL: "gpt-4o",
  API_LLM_MODEL_CHATGPT_4_ALL_MINI: "gpt-4o-mini",
  API_LLM_MODEL_CLAUDE_3_5_SONNET: "claude-3-5-sonnet-20241022",
  API_LLM_MODEL_CLAUDE_3_5_SONNET_20241022: "claude-3-5-sonnet-20241022",
  API_LLM_MODEL_GEMINI_1_5_PRO: "gpt-4o-mini",
  API_LLM_MODEL_GEMINI_1_5_PRO_EXP: "gpt-4o-mini",

  // Ports
  WEB_PORT: "3000",
  API_PORT: "3001",

  // RabbitMQ
  RABBITMQ_DEFAULT_USER: "kodus",
};

export const DOCKER_NETWORKS = [
  'shared-network',
  'monitoring-network',
  'kodus-backend-services'
];

export const CRITICAL_ERRORS = [
  "password authentication failed",
  "Unable to connect to the database",
  "FATAL:",
  "MongoServerError:",
  "connection refused"
]; 