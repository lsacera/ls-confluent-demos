CREATE TABLE IF NOT EXISTS smartcity_services_sla (
  category STRING,
  priority STRING,
  window_start TIMESTAMP_LTZ(3),
  window_end TIMESTAMP_LTZ(3),

  total_tickets BIGINT,
  open_tickets BIGINT,
  in_progress_tickets BIGINT,
  resolved_tickets BIGINT,
  closed_tickets BIGINT,
  rejected_tickets BIGINT,

  avg_sla_hours INT,
  tickets_within_sla BIGINT,
  tickets_overdue BIGINT,

  PRIMARY KEY (category, priority, window_start) NOT ENFORCED
)
AS
SELECT
  category,
  priority,
  window_start,
  window_end,

  COUNT(DISTINCT ticket_id) AS total_tickets,

  COUNT(DISTINCT CASE WHEN CAST(status AS STRING) = 'ABIERTO' THEN ticket_id END) AS open_tickets,
  COUNT(DISTINCT CASE WHEN CAST(status AS STRING) = 'EN_PROCESO' THEN ticket_id END) AS in_progress_tickets,
  COUNT(DISTINCT CASE WHEN CAST(status AS STRING) = 'RESUELTO' THEN ticket_id END) AS resolved_tickets,
  COUNT(DISTINCT CASE WHEN CAST(status AS STRING) = 'CERRADO' THEN ticket_id END) AS closed_tickets,
  COUNT(DISTINCT CASE WHEN CAST(status AS STRING) = 'RECHAZADO' THEN ticket_id END) AS rejected_tickets,

  CAST(ROUND(AVG(sla_hours)) AS INT) AS avg_sla_hours,

  COUNT(DISTINCT
    CASE
      WHEN resolved_at IS NOT NULL
       AND (resolved_at - created_at) / 3600000 <= sla_hours
      THEN ticket_id END
  ) AS tickets_within_sla,

  COUNT(DISTINCT
    CASE
      WHEN resolved_at IS NULL
       AND (UNIX_TIMESTAMP() * 1000 - created_at) / 3600000 > sla_hours
      THEN ticket_id END
  ) AS tickets_overdue

FROM TABLE(
  TUMBLE(
    TABLE `smartcity-service`,
    DESCRIPTOR(`$rowtime`),
    INTERVAL '5' MINUTES
  )
)
GROUP BY
  category,
  priority,
  window_start,
  window_end;