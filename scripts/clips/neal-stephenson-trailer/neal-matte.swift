import Foundation
import Vision
import CoreImage
import ImageIO
import UniformTypeIdentifiers

// usage: matte <in.jpg> <out_mask.png> <mode: person|fg>
let args = CommandLine.arguments
let inURL = URL(fileURLWithPath: args[1])
let outURL = URL(fileURLWithPath: args[2])
let mode = args.count > 3 ? args[3] : "fg"
guard let src = CGImageSourceCreateWithURL(inURL as CFURL, nil), let cg = CGImageSourceCreateImageAtIndex(src, 0, nil) else { fatalError("read") }
let handler = VNImageRequestHandler(cgImage: cg, options: [:])
var maskBuf: CVPixelBuffer? = nil
if mode == "person" {
  let req = VNGeneratePersonSegmentationRequest()
  req.qualityLevel = .accurate
  req.outputPixelFormat = kCVPixelFormatType_OneComponent8
  try handler.perform([req])
  maskBuf = req.results?.first?.pixelBuffer
} else {
  let req = VNGenerateForegroundInstanceMaskRequest()
  try handler.perform([req])
  guard let r = req.results?.first else { fatalError("no fg") }
  maskBuf = try r.generateScaledMaskForImage(forInstances: r.allInstances, from: handler)
}
guard let mb = maskBuf else { fatalError("no mask") }
var ci = CIImage(cvPixelBuffer: mb)
let sx = CGFloat(cg.width) / ci.extent.width, sy = CGFloat(cg.height) / ci.extent.height
if abs(sx - 1) > 0.001 || abs(sy - 1) > 0.001 { ci = ci.transformed(by: CGAffineTransform(scaleX: sx, y: sy)) }
let ctx = CIContext()
let gray = CGColorSpaceCreateDeviceGray()
guard let outCG = ctx.createCGImage(ci, from: CGRect(x: 0, y: 0, width: cg.width, height: cg.height), format: .L8, colorSpace: gray) else { fatalError("cg") }
let dest = CGImageDestinationCreateWithURL(outURL as CFURL, UTType.png.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(dest, outCG, nil)
CGImageDestinationFinalize(dest)
print("ok", cg.width, cg.height)
