-- Trigger: message_trigger
CREATE OR REPLACE FUNCTION message_trigger() RETURNS trigger AS $trigger$
DECLARE
  rec messages;
  dat messages;
  payload TEXT;
BEGIN
  rec := NEW;
  dat := OLD;

  -- Build the payload
  payload := json_build_object(
    'id',rec.id,
    'sn',rec.sn,
    'status',rec.status,
    'src_network',rec.src_network,
    'src_block_number',rec.src_block_number,
    'src_block_timestamp',rec.src_block_timestamp,
    'src_tx_hash',rec.src_tx_hash,
    'src_address',rec.src_app,
    'src_error',rec.src_error,
    'dest_network',rec.dest_network,
    'dest_block_number',rec.dest_block_number,
    'dest_block_timestamp',rec.dest_block_timestamp,
    'dest_tx_hash',rec.dest_tx_hash,
    'dest_address',rec.dest_app,
    'dest_error',rec.dest_error,
    'response_block_number',rec.response_block_number,
    'response_block_timestamp',rec.response_block_timestamp,
    'response_tx_hash',rec.response_tx_hash,
    'response_error',rec.response_error,
    'rollback_block_number',rec.rollback_block_number,
    'rollback_block_timestamp',rec.rollback_block_timestamp,
    'rollback_tx_hash',rec.rollback_tx_hash,
    'rollback_error',rec.rollback_error,
    'created_at',rec.created_at,
    'updated_at',rec.updated_at
    );

  -- Notify the channel
  IF TG_OP = 'UPDATE' THEN
    IF rec.status != dat.status THEN
      PERFORM pg_notify('message', payload);
    END IF;
  ELSE 
    PERFORM pg_notify('message', payload);
  END IF;

  RETURN rec;
END;
$trigger$ LANGUAGE plpgsql;



-- Trigger: message_notify
CREATE TRIGGER message_notify AFTER INSERT OR UPDATE
ON messages
FOR EACH ROW EXECUTE PROCEDURE message_trigger();