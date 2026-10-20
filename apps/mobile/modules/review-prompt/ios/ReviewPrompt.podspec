Pod::Spec.new do |s|
  s.name           = 'ReviewPrompt'
  s.version        = '1.0.0'
  s.summary        = '앱 안 별점 카드를 띄우고 떴는지 감지하는 로컬 모듈'
  s.author         = ''
  s.homepage       = 'https://landit.im'
  s.platforms      = { :ios => '16.0' }
  s.source         = { :git => '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
end
