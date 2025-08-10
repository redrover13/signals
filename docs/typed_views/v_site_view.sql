-- BigQuery: Typed view for site.view events
CREATE OR REPLACE VIEW `saigon-signals.dulce.v_site_view` AS
SELECT
  ts,
  JSON_VALUE(payload, '$.page') AS page,
  JSON_VALUE(payload, '$.utm.s') AS utm_source
FROM `saigon-signals.dulce.events`
WHERE type = 'site.view';
