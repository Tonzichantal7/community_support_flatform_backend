# Analytics System - Installation Instructions

## Required Package Installation

To use the analytics export features (CSV/JSON), you need to install the json2csv package:

```bash
npm install json2csv @types/json2csv --save
```

## Analytics Endpoints

### Admin Analytics Routes (All require admin authentication)

1. **GET /api/admin/analytics/requests-by-category**
   - Get total service requests grouped by category

2. **GET /api/admin/analytics/most-active-users?limit=10**
   - Get most active users based on requests and responses

3. **GET /api/admin/analytics/resolution-rates**
   - Calculate request resolution rates and average resolution time

4. **GET /api/admin/analytics/system-usage**
   - Get overall system usage statistics

5. **GET /api/admin/analytics/time-based-activity?period=daily&range=7**
   - Get activity reports based on time periods
   - period: 'daily', 'weekly', 'monthly'
   - range: number of days/weeks/months

6. **GET /api/admin/analytics/export/csv?type=requests**
   - Export analytics data to CSV
   - type: 'requests', 'users', 'responses', 'reports'

7. **GET /api/admin/analytics/export/json?type=requests**
   - Export analytics data to JSON
   - type: 'requests', 'users', 'responses', 'reports'

8. **GET /api/admin/analytics/dashboard**
   - Get comprehensive dashboard with all analytics in one call

## Features

- Request analytics by category
- User activity tracking
- Resolution rate calculations
- System usage statistics
- Time-based activity reports
- CSV/JSON export functionality
- Comprehensive admin dashboard

## Helper Utilities

Located in `src/utils/analyticsHelper.ts`:
- calculatePercentage()
- getDateRange()
- formatDuration()
- getCSVFields()
