using Microsoft.Data.SqlClient;
using PatientVisitManager.Api.Models;
using PatientVisitManager.Api.Repositories.Interfaces;

namespace PatientVisitManager.Api.Repositories.Sql;
public class UserRepository : BaseRepository, IUserRepository
{
    public UserRepository(IConfiguration cfg) : base(cfg) { }

    public async Task<User?> GetByEmailAsync(string email)
    {
        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT TOP 1 Id, Email, PasswordHash, PasswordSalt, Role, CreatedAt, IsActive FROM Users WHERE Email=@E";
        cmd.Parameters.AddWithValue("@E", email);
        using var r = await cmd.ExecuteReaderAsync();
        if (await r.ReadAsync())
        {
            return new User
            {
                Id = r.GetInt32(0),
                Email = r.GetString(1),
                PasswordHash = r.GetString(2),
                PasswordSalt = r.GetString(3),
                Role = r.GetString(4),
                CreatedAt = r.GetDateTime(5),
                IsActive = r.GetBoolean(6)
            };
        }
        return null;
    }

    public async Task<int> CreateAsync(User user)
    {
        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"INSERT INTO dbo.Users (Email, PasswordHash, PasswordSalt, Role, IsActive)
                            OUTPUT INSERTED.Id VALUES (@E,@H,@S,@R,1)";
        cmd.Parameters.AddWithValue("@E", user.Email);
        cmd.Parameters.AddWithValue("@H", user.PasswordHash);
        cmd.Parameters.AddWithValue("@S", user.PasswordSalt);
        cmd.Parameters.AddWithValue("@R", user.Role);

        try
        {
            return (int)(await cmd.ExecuteScalarAsync() ?? 0);
        }
        catch (SqlException ex) when (ex.Number == 2601 || ex.Number == 2627) // duplicate key
        {
            throw new InvalidOperationException("Email already exists.", ex);
        }
        catch (SqlException ex) when (ex.Number == 208) // invalid object name
        {
            throw new InvalidOperationException("Users table not found. Ensure dbo.Users exists.", ex);
        }
    }

    public async Task UpdatePasswordAsync(int id, string newHash, string newSalt)
    {
        using var conn = CreateConn(); await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "UPDATE dbo.Users SET PasswordHash=@H, PasswordSalt=@S WHERE Id=@Id";
        cmd.Parameters.AddWithValue("@H", newHash);
        cmd.Parameters.AddWithValue("@S", newSalt);
        cmd.Parameters.AddWithValue("@Id", id);
        await cmd.ExecuteNonQueryAsync();
    }
}
