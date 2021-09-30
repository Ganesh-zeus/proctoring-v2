using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backendApi.Models
{
    public class FileModel
    {
        public IFormFile MyFile { get; set; }
        public string Label { get; set; }
    }
}
