using Covid19.Server.Models;
using Covid19.Server.Services;
using Microsoft.AspNetCore.OData;
using Microsoft.OData.ModelBuilder;

namespace Covid19.Server
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            var modelBuilder = new ODataConventionModelBuilder();
            modelBuilder.EntitySet<CovidConfirmedCase>("CovidConfirmed");
            modelBuilder.EntitySet<CovidDeathCase>("CovidDeath");
            modelBuilder.EntitySet<CovidRecoverCase>("CovidRecover");
            modelBuilder.EntitySet<CovidDailyReport>("CovidDailyReports");


            // Add services to the container.

            builder.Services.AddControllers().AddOData(options => options
                    .Select()
                    .Filter()
                    .OrderBy()
                    .Count()
                    .Expand()
                    .SetMaxTop(1000)
                    .AddRouteComponents("odata", modelBuilder.GetEdmModel())
            );
            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            builder.Services.AddHttpClient();
            builder.Services.AddCors(options =>
            {
                options.AddDefaultPolicy(policy =>
                {
                    policy.AllowAnyOrigin()
                          .AllowAnyHeader()
                          .AllowAnyMethod();
                });
            });

            builder.Services.AddSingleton<CovidConfirmService>();
            builder.Services.AddSingleton<CovidDeathService>();
            builder.Services.AddSingleton<CovidRecoverService>();
            builder.Services.AddSingleton<DailyReportService>();


            var app = builder.Build();

            app.UseDefaultFiles();
            app.UseStaticFiles();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

            app.UseAuthorization();


            app.MapControllers();

            app.MapFallbackToFile("/index.html");

            app.Run();
        }
    }
}
