Pod::Spec.new do |s|
  s.name           = 'WidgetInventory'
  s.version        = '1.0.0'
  s.summary        = '홈 화면에 놓인 우리 위젯 목록을 조회하는 로컬 모듈'
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
