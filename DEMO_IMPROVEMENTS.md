# Demo Improvements - Realistic Data Generation

## Overview
Modified the DB Feeder and Payments App to generate data with realistic business patterns instead of uniform intervals.

## Changes Made

### Previous Behavior
- **Fixed interval**: 5 seconds between each order/payment
- **Volume**: ~720 orders/hour, ~720 payments/hour (constant)
- **Pattern**: Completely uniform 24/7

### New Behavior
**Dynamic intervals based on time of day with randomization:**

| Time Period | Description | Orders/Hour | Interval Range |
|------------|-------------|-------------|----------------|
| 12am - 6am | Overnight (very slow) | 1-2 | 30-60 min |
| 6am - 10am | Morning (moderate) | 60-120 | 30-60 sec |
| 10am - 2pm | **Lunch Peak** (high) | 180-360 | 10-20 sec |
| 2pm - 6pm | Afternoon (moderate) | 90-180 | 20-40 sec |
| 6pm - 10pm | **Dinner Peak** (high) | 180-360 | 10-20 sec |
| 10pm - 12am | Night (low) | 45-90 | 40-80 sec |

### Payment Failure Rate
**Changed from ~1.6% to 12% failure rate**
- Previous: Only failed when counter == 5 (every 6th payment)
- New: Random 12% failure rate using `random.nextInt(100) < 12`
- More realistic for online payment processing
- Failed payments generate invalid confirmation code ("0") which triggers DLQ

### Benefits
1. **More realistic dashboard visualizations** - Shows clear business patterns
2. **Manageable data volume** - Reduces from ~17,000 to ~3,000-5,000 orders/day
3. **Better for demos** - Viewers can see variations in the graphs
4. **Natural randomness** - Each interval varies within the range
5. **Realistic payment failures** - 12% failure rate reflects real-world scenarios

## Files Modified
- `code/postgresql-data-feeder/src/main/java/com/example/DataFeeder.java`
- `code/payments-app/src/main/java/io/confluent/examples/datacontract/ProducerApp.java`

## Deployment
To deploy these changes:
```bash
./deploy-retail-demo.sh
```

Or for targeted rebuild:
```bash
cd terraform
terraform apply -target=module.retail_flink_queries
```
