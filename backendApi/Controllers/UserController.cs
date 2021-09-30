using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

using backendApi.Models;
using Microsoft.AspNetCore.Cors;
using System.Net.Http;
using System.Net;

namespace backendApi.Controllers
{
    [ApiController]
    // [EnableCors("MyPolicy")]
    [Route("users")]
    public class FileManagerController : ControllerBase
    {
        private readonly string AppDirectory = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        private readonly string SERVER_URL = "https://localhost:5001/";

        // acts as local memory but gets flushed if server is stopped
        private static List<FileRecord> fileDB = new List<FileRecord>();

        [HttpPost]
        [Consumes("multipart/form-data")]
        public async Task<HttpResponseMessage> PostAsync([FromForm] FileModel model)
        {
            model.Label = model.Label.ToUpper();
            try
            {
                FileRecord file = await SaveFileAsync(model.MyFile,model.Label);

                if (!string.IsNullOrEmpty(file.FilePath))
                {
                    //Save to Inmemory object
                    fileDB.Add(file);

                    return new HttpResponseMessage(HttpStatusCode.OK);
                }
                else
                    return new HttpResponseMessage(HttpStatusCode.BadRequest);
            }
            catch (Exception ex)
            {
                return new HttpResponseMessage(HttpStatusCode.InternalServerError)
                {
                    Content = new StringContent(ex.Message),
                };
            }
        }

        private async Task<FileRecord> SaveFileAsync(IFormFile myFile,string Label)
        {
            FileRecord file = new FileRecord();

            if (myFile != null)
            {
                if (!Directory.Exists(AppDirectory))
                    Directory.CreateDirectory(AppDirectory);
               
                var folderPath = Path.Combine(AppDirectory, "data", Label);
                var fileName = Label + Path.GetExtension(myFile.FileName);
                var path = Path.Combine(folderPath, fileName);

                if (!Directory.Exists(folderPath))
                    Directory.CreateDirectory(folderPath);

                file.Id = fileDB.Count() + 1;
                file.FilePath = path;
                file.FileName = fileName;
                file.FileFormat = Path.GetExtension(myFile.FileName);
                file.ContentType = myFile.ContentType;

                using (var stream = new FileStream(path, FileMode.Create))
                {
                    await myFile.CopyToAsync(stream);
                }

                return file;
            }
            return file;
        }

        // [HttpGet]
        [HttpGet("[action]")]
        public List<string> AllLabels()
        {
            var dataFolderPath = Path.Combine(AppDirectory, "data");
            List<string> labels = Directory.GetDirectories(dataFolderPath).Select(d => new DirectoryInfo(d).Name).ToList();

            return labels;

            // return new JsonResult("ABC");
        }

        [HttpGet]
        public JsonResult GetImageUrl(string label)
        {
            label = label.ToUpper();
            string url = "";

            var folderPath = Path.Combine(AppDirectory, "data", label);

            if (Directory.Exists(folderPath))
            {
                string[] files = Directory.GetFiles(folderPath);

                var filePath = files[0];
                url = SERVER_URL + "data/" + label + "/" + label + Path.GetExtension(filePath);
            }

            return new JsonResult(url);
        }

        /*[HttpGet("{label}")]
        public async Task<IActionResult> DownloadFile(string label)
        {
            label = label.ToUpper();

            var folderPath = Path.Combine(AppDirectory, "data", label);

            if (Directory.Exists(folderPath)){ 
                string[] files = Directory.GetFiles(folderPath);

                var filePath = files[0];

                var memory = new MemoryStream();
                using (var stream = new FileStream(filePath, FileMode.Open))
                {
                    await stream.CopyToAsync(memory);
                }
                memory.Position = 0;

                var contentType = "APPLICATION/octet-stream";
                var fileName = Path.GetFileName(filePath);
    
                return File(memory, contentType, fileName);
            }
            else
            {
                // folder with given Label does not exist
                return new EmptyResult();
            }   
        }*/
    }
}
