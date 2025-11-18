using Microsoft.EntityFrameworkCore;
using Covid19.Server.Models;

namespace Covid19.Server
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<CovidConfirmedCase> CovidConfirmedCases { get; set; }
        public DbSet<CovidDeathCase> CovidDeathCases { get; set; }
        public DbSet<CovidRecoverCase> CovidRecoverCases { get; set; }
        public DbSet<CovidDailyReport> CovidDailyReports { get; set; }
        public DbSet<CovidDataPoint> CovidDataPoints { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<CovidConfirmedCase>()
                .Property(e => e.Date)
                .HasColumnType("timestamp with time zone");

            modelBuilder.Entity<CovidDeathCase>()
                .Property(e => e.Date)
                .HasColumnType("timestamp with time zone");

            modelBuilder.Entity<CovidRecoverCase>()
                .Property(e => e.Date)
                .HasColumnType("timestamp with time zone");

            modelBuilder.Entity<CovidDailyReport>()
                .Property(e => e.LastUpdate)
                .HasColumnType("timestamp with time zone");

            modelBuilder.Entity<CovidDataPoint>()
                .Property(e => e.Date)
                .HasColumnType("timestamp with time zone");
        }
    }
}