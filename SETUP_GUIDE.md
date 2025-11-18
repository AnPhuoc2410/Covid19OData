# COVID-19 Dashboard - Quick Start Guide

## 📋 Overview
This is a comprehensive COVID-19 data visualization platform with:
- **Frontend**: React 18 + TypeScript with interactive maps
- **Backend**: ASP.NET Core 8.0 with OData API
- **Database**: PostgreSQL
- **Deployment Ready**: Full-stack production application

---

## 🚀 Quick Setup (5 Minutes)

### Prerequisites Checklist
- [ ] .NET 8.0 SDK installed
- [ ] Node.js 18+ installed  
- [ ] PostgreSQL 12+ running
- [ ] Git installed

### Step-by-Step Setup

#### Step 1: Clone & Navigate
```bash
git clone https://github.com/AnPhuoc2410/Covid19OData.git
cd Covid19
```

#### Step 2: Setup PostgreSQL Database
```bash
# Create database
psql -U postgres -c "CREATE DATABASE covid19_db;"
```

#### Step 3: Configure Backend
```bash
cd Covid19.Server

# Edit appsettings.json and update:
# "DefaultConnection": "Host=localhost;Port=5432;Database=covid19_db;Username=postgres;Password=YOUR_PASSWORD"

# Install dependencies
dotnet restore

# Apply migrations
dotnet ef database update

# Start backend
dotnet run
# Backend runs on: https://localhost:5001
```

#### Step 4: Configure Frontend
```bash
cd ../covid19.client

# Install dependencies
npm install

# Start development server
npm run dev
# Frontend runs on: https://localhost:5173
```

#### Step 5: Access the Application
- **Dashboard**: https://localhost:5173
- **API Docs**: https://localhost:5001/swagger
- **API Base**: https://localhost:5001/odata

---

## 📊 Key Features

### Frontend Features
✅ Interactive World Map with COVID data overlay
✅ Real-time statistics dashboard
✅ Continental filtering and analysis
✅ Responsive design
✅ Charts and data visualizations

### Backend Features
✅ OData-compliant REST API
✅ Flexible data querying with OData filters
✅ Entity Framework Core ORM
✅ PostgreSQL database
✅ Swagger UI for API documentation
✅ CORS enabled for frontend integration

---

## 🔌 API Examples

### Get Confirmed Cases by Country
```
GET /odata/CovidConfirmed?$filter=CountryRegion eq 'US'&$select=Date,Confirmed
```

### Get Top 10 Countries by Deaths
```
GET /odata/CovidDeath?$orderby=Deaths desc&$top=10
```

### Get Recovery Data with Pagination
```
GET /odata/CovidRecover?$skip=0&$top=100
```

### Count Total Records
```
GET /odata/CovidConfirmed/$count
```

---

## 🛠 Development Commands

### Backend
```bash
cd Covid19.Server

# Run in watch mode (rebuilds on changes)
dotnet watch run

# Build only
dotnet build

# Create migration
dotnet ef migrations add MigrationName

# View migrations
dotnet ef migrations list
```

### Frontend
```bash
cd covid19.client

# Development with hot reload
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

---

## 💾 Database Schema

### CovidConfirmedCase Table
```
- Id: GUID (Primary Key)
- ProvinceState: string (nullable)
- CountryRegion: string
- Lat: double (nullable)
- Long: double (nullable)
- Date: datetime
- Confirmed: int
```

### CovidDeathCase Table
```
- Id: GUID (Primary Key)
- ProvinceState: string (nullable)
- CountryRegion: string
- Lat: double (nullable)
- Long: double (nullable)
- Date: datetime
- Deaths: int
```

### CovidRecoverCase Table
```
- Id: GUID (Primary Key)
- ProvinceState: string (nullable)
- CountryRegion: string
- Lat: double (nullable)
- Long: double (nullable)
- Date: datetime
- Recovered: int
```

### CovidDailyReport Table
```
- Id: GUID (Primary Key)
- Date: datetime
- CountryRegion: string
- LastUpdate: datetime
```

---

## 🐛 Common Issues & Solutions

### Port Already in Use (Windows)
```bash
# Find process on port 5001
netstat -ano | findstr :5001

# Kill process
taskkill /PID <PID> /F
```

### Database Connection Failed
1. Verify PostgreSQL is running
2. Check credentials in appsettings.json
3. Verify database exists: `psql -U postgres -l`
4. Test connection: `psql -U postgres -d covid19_db`

### Certificate Issues
```bash
# Clean and regenerate
dotnet dev-certs https --clean
dotnet dev-certs https --trust
```

### Node Modules Issues
```bash
cd covid19.client
rm -r node_modules package-lock.json
npm install
```

---

## 📁 Project Structure

```
Covid19/
├── Covid19.Server/
│   ├── Controllers/
│   ├── Models/
│   ├── Services/
│   ├── Migrations/
│   ├── ApplicationDbContext.cs
│   ├── Program.cs
│   └── appsettings.json
│
├── covid19.client/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── covid.ts
│   │   ├── main.tsx
│   │   └── assets/
│   ├── public/
│   │   ├── map.json
│   │   └── *.svg (diagrams)
│   ├── package.json
│   └── vite.config.ts
│
└── Covid19.sln
```

---

## 🔄 OData Query Syntax

| Operation | Example |
|-----------|---------|
| Filter | `$filter=CountryRegion eq 'US'` |
| Select | `$select=Date,Confirmed` |
| OrderBy | `$orderby=Confirmed desc` |
| Top | `$top=10` |
| Skip | `$skip=20` |
| Count | `$count=true` |
| Expand | `$expand=DailyReports` |

---

## 📚 Documentation Links

- [ASP.NET Core](https://docs.microsoft.com/aspnet/core)
- [React Documentation](https://react.dev)
- [OData Protocol](https://www.odata.org/)
- [Entity Framework Core](https://docs.microsoft.com/ef/core)
- [PostgreSQL](https://www.postgresql.org/docs)

---

## 📧 Support

For issues or questions, please refer to:
- README.md - Full documentation
- Swagger UI - Interactive API docs
- GitHub Issues - Bug reports

---

## 📄 License

MIT License - See LICENSE.txt for details

**Author**: An Phuoc ([@AnPhuoc2410](https://github.com/AnPhuoc2410))  
**Repository**: [Covid19OData](https://github.com/AnPhuoc2410/Covid19OData)  
**Last Updated**: November 2025
