#!/bin/bash
# Script to reset completed_orders topic
# This deletes old messages with null keys

echo "⚠️  This will delete all messages in the completed_orders topic"
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

# Get environment and cluster IDs from terraform output
ENV_ID=$(cd terraform && terraform output -raw resource-ids | grep "Environment ID:" | awk '{print $3}')
CLUSTER_ID=$(cd terraform && terraform output -raw resource-ids | grep "Kafka Cluster ID:" | awk '{print $4}')

echo "Environment: $ENV_ID"
echo "Cluster: $CLUSTER_ID"

# Delete and recreate the topic to clear old messages
confluent kafka topic delete completed_orders \
  --environment "$ENV_ID" \
  --cluster "$CLUSTER_ID"

echo "Topic deleted. Flink will recreate it automatically with proper keys."
echo "Wait 30 seconds and check Flink statement status..."
