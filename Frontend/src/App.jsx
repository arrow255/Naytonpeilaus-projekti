// src/App.jsx
import { PinInput, Box, VStack, Button, Text, Flex } from "@chakra-ui/react"
import { Link } from "react-router-dom"
import { useTranslation } from 'react-i18next';


function App() {
  const { t } = useTranslation();
  return (
    <Box bg="yellow.100" minH="100vh" w="100%">
      {/* banner */}
       <Box p={4} bgGradient="to-b" gradientFrom="orange.200" gradientTo="yellow.100" position="relative">
        <Text fontSize="5xl" fontWeight="bold" textAlign="center">
          {t('welcomeBanner')}
        </Text>
        <Flex position="absolute" top="50%" right="1rem" transform="translateY(-50%)">
          <Button colorPalette="teal" onClick={() => i18n.changeLanguage('fi')} mr={2}>FI</Button>
          <Button colorPalette="teal" onClick={() => i18n.changeLanguage('en')}>EN</Button>
        </Flex>
      </Box>
        

      <Box display="flex" justifyContent="center" alignItems="center" minHeight="48vh">
        
        
        <VStack spacing={7} align="center">
          {/* pin koodi paikka
          <Box width="100%" padding="4" color="black" fontSize="3xl">
            Liity opettajan huoneeseen syöttämällä liittymiskoodi:
          </Box>
          
           
          <PinInput.Root type="alphanumeric" placeholder="" >
            <PinInput.HiddenInput />
            <PinInput.Control>
              <PinInput.Input index={0} w="80px" h="80px" fontSize="3xl" borderWidth="3px" borderColor="black" />
              <Box padding="2"></Box>
              <PinInput.Input index={1} w="80px" h="80px" fontSize="3xl" borderWidth="3px" borderColor="black"/>
              <Box padding="4" fontSize="5xl" lineHeight="40px">-</Box>
              <PinInput.Input index={2} w="80px" h="80px" fontSize="3xl" borderWidth="3px" borderColor="black"/>
              <Box padding="2"></Box>
              <PinInput.Input index={3} w="80px" h="80px" fontSize="3xl" borderWidth="3px" borderColor="black"/>
            </PinInput.Control>
          </PinInput.Root>
          
          <Box padding="4" color="black" fontSize="3xl" justifyContent="center" alignItems="center">
            TAI
          </Box>
          */}
          <Button 
          as={Link} to="/create_room" 
          colorPalette="teal" 
          variant="surface"
          fontSize = {30}
          px={20}
          py={10}
          > 
            Luo huone   
          </Button>
          
          <Button 
          as={Link} to="/join_room" 
          colorPalette="teal" 
          fontSize = {30}
          px={10}
          py={10} 
          variant="surface"
          >
            Kirjaudu sisään
          </Button>
        </VStack>
      </Box>
    </Box>
  )
}

export default App
