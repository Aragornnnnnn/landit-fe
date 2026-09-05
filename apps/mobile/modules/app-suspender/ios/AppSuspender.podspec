Pod::Spec.new do |s|
  s.name           = 'AppSuspender'
  s.version        = '1.0.0'
  s.summary        = '앱을 홈 화면으로 내리는 로컬 모듈'
  s.author         = ''
  s.homepage       = 'https://landit.im'
  s.platforms      = { :ios => '15.1' }
  s.source         = { :git => '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
end
